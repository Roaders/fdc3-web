/* Morgan Stanley makes this available to you under the Apache License,
 * Version 2.0 (the "License"). You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0.
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Unless required by applicable law or agreed
 * to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License. */

import { AgentError, type DesktopAgent } from '@finos/fdc3';
import { AppDirectory } from '../app-directory';
import { DefaultResolver } from '../app-directory/app-resolver.default';
import { ChannelFactory } from '../channel';
import {
    IRootMessagingProvider,
    MessagingProviderFactory,
    ProxyDesktopAgentFactoryParams,
    RootDesktopAgentFactoryParams,
} from '../contracts';
import { createLogger, getWindow } from '../helpers';
import { RootMessagePublisher } from '../messaging';
import { DefaultRootMessagingProvider } from '../messaging-provider';
import { DesktopAgentImpl } from './desktop-agent';
import { DesktopAgentProxy } from './desktop-agent-proxy';

/**
 * A factory to create an instance of DesktopAgent
 */
export class DesktopAgentFactory {
    /**
     * Optional constructor params to allow us to test
     */
    constructor(
        /**
         * This is used if there is no messagingProviderFactory passed in the createRoot method
         */
        private defaultRootMessagingProviderFactory?: MessagingProviderFactory<IRootMessagingProvider>,
        private rootMessagePublisherFactory?: (
            messagingProvider: IRootMessagingProvider,
            directory: AppDirectory,
            window: WindowProxy,
        ) => RootMessagePublisher,
    ) {}

    /**
     * Creates a new instance of DesktopAgent
     * @returns DesktopAgent
     */
    public async createRoot(factoryParams: RootDesktopAgentFactoryParams): Promise<DesktopAgent> {
        const log = createLogger('DesktopAgentFactory.createRoot');

        let agentResolve: (value: DesktopAgent) => void = () => {
            throw new Error(`agent Promise is not defined. Unable to update agent`);
        };

        // create a createAgentPromise that we can pass to elements that need to be constructed before the agent but that require the agent
        const agentPromise: Promise<DesktopAgent> = new Promise(resolve => (agentResolve = resolve));
        const appResolverPromise =
            factoryParams.uiProvider != null
                ? factoryParams.uiProvider(agentPromise)
                : Promise.resolve(new DefaultResolver(agentPromise));

        const messagingProvider = await this.constructRootMessagingProvider(factoryParams.messagingProviderFactory);

        log('Messaging Provider constructed', 'debug');

        const directory = new AppDirectory(appResolverPromise, factoryParams.appDirectoryUrls);
        const rootMessagePublisher =
            this.rootMessagePublisherFactory != null
                ? this.rootMessagePublisherFactory(messagingProvider, directory, window)
                : new RootMessagePublisher(messagingProvider, directory, window);

        // retrieve the root agent details from the app directory
        const appIdentifier = await rootMessagePublisher.initialise();

        if (appIdentifier == null) {
            log('AppIdentifier could not be resolved', 'error');
            // app details could not be found
            return Promise.reject(AgentError.AccessDenied);
        }

        log('AppIdentifier resolved', 'debug', appIdentifier);

        const agent = new DesktopAgentImpl({
            appIdentifier,
            rootMessagePublisher,
            directory: directory,
            channelFactory: new ChannelFactory(),
            openStrategies: factoryParams.openStrategies,
        });

        log('Agent constructed', 'debug', agent);

        agentResolve(agent);

        this.updateWindow(agent);

        return agent;
    }

    public async createProxy(factoryParams: ProxyDesktopAgentFactoryParams): Promise<DesktopAgent> {
        const messagingProvider = await factoryParams.messagingProviderFactory();

        const agent = new DesktopAgentProxy({
            appIdentifier: factoryParams.appIdentifier,
            messagingProvider,
            channelFactory: new ChannelFactory(),
        });

        this.updateWindow(agent);

        return agent;
    }

    private constructRootMessagingProvider(
        paramsFactory?: MessagingProviderFactory<IRootMessagingProvider>,
    ): Promise<IRootMessagingProvider> {
        if (paramsFactory != null) {
            return paramsFactory();
        } else if (this.defaultRootMessagingProviderFactory != null) {
            return this.defaultRootMessagingProviderFactory();
        }

        return Promise.resolve(new DefaultRootMessagingProvider(window));
    }

    // TODO: move this to getAgent
    private updateWindow(agent: DesktopAgent): void {
        const windowProxy = getWindow();

        if (windowProxy.fdc3 == null) {
            /**
             * At this point we are allowing multiple agents in one DOM window. If one has not yet been created then we add the first to window.fdc3.
             * This is NOT spec compliant but it will allow us to get the test harness up and running quickly and not worry about cross iframe messaging.
             * We do need to consider other agent initialization mechanisms - most of which are handled by the getAgent() proposed implementation
             * https://github.com/finos/FDC3/issues/1243
             * https://github.com/finos/FDC3/issues/1249
             */

            windowProxy.fdc3 = agent;
            windowProxy.dispatchEvent(new Event('fdc3Ready'));
        }
    }
}
