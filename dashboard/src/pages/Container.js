import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import Dashboard from '../components/Dashboard';
import ContainerSecurityForm from '../components/security/ContainerSecurityForm';
import ContainerSecurity from '../components/security/ContainerSecurity';
import { logEvent } from '../analytics';
import { SHOULD_LOG_ANALYTICS, API_URL } from '../config';
import {
    getContainerSecurities,
    getContainerSecurityLogs,
    scanContainerSecuritySuccess,
    getContainerSecuritySuccess,
} from '../actions/security';
import { LargeSpinner } from '../components/basic/Loader';
import ShouldRender from '../components/basic/ShouldRender';
import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import getParentRoute from '../utils/getParentRoute';
import io from 'socket.io-client';

// Important: Below `/api` is also needed because `io` constructor strips out the path from the url.
const socket = io.connect(API_URL.replace('/api', ''), {
    path: '/api/socket.io',
});
class Container extends Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    componentDidMount() {
        if (SHOULD_LOG_ANALYTICS) {
            logEvent('Container Security page Loaded');
        }
    }

    ready = () => {
        const {
            projectId,
            componentId,
            getContainerSecurities,
            getContainerSecurityLogs,
        } = this.props;

        // load container security logs
        getContainerSecurityLogs({ projectId, componentId });

        // load container security
        getContainerSecurities({ projectId, componentId });
    };

    render() {
        const {
            componentId,
            projectId,
            containerSecurities,
            gettingContainerSecurities,
            gettingSecurityLogs,
            location: { pathname },
            components,
            scanContainerSecuritySuccess,
            getContainerSecuritySuccess,
        } = this.props;

        containerSecurities.length > 0 &&
            containerSecurities.map(containerSecurity => {
                socket.on(`security_${containerSecurity._id}`, data => {
                    getContainerSecuritySuccess(data);
                });

                socket.on(`securityLog_${containerSecurity._id}`, data => {
                    scanContainerSecuritySuccess(data);
                });

                return containerSecurity;
            });

        const componentName =
            components.length > 0 ? components[0].name : 'loading...';

        return (
            <Dashboard ready={this.ready}>
                <BreadCrumbItem
                    route={getParentRoute(pathname, null, 'component')}
                    name={componentName}
                />
                <BreadCrumbItem
                    route={pathname}
                    name="Container Security"
                    pageTitle="Container"
                />
                <div className="Margin-vertical--12">
                    <div>
                        <div className="db-BackboneViewContainer">
                            <div className="react-settings-view react-view">
                                <ShouldRender
                                    if={
                                        gettingContainerSecurities &&
                                        gettingSecurityLogs
                                    }
                                >
                                    <div
                                        id="largeSpinner"
                                        style={{ textAlign: 'center' }}
                                    >
                                        <LargeSpinner />
                                    </div>
                                </ShouldRender>
                                <ShouldRender
                                    if={
                                        !gettingContainerSecurities &&
                                        !gettingSecurityLogs
                                    }
                                >
                                    {containerSecurities.length > 0 &&
                                        containerSecurities.map(
                                            containerSecurity => {
                                                return (
                                                    <span
                                                        key={
                                                            containerSecurity._id
                                                        }
                                                    >
                                                        <div>
                                                            <div>
                                                                <ContainerSecurity
                                                                    name={
                                                                        containerSecurity.name
                                                                    }
                                                                    dockerRegistryUrl={
                                                                        containerSecurity.dockerRegistryUrl
                                                                    }
                                                                    imagePath={
                                                                        containerSecurity.imagePath
                                                                    }
                                                                    containerSecurityId={
                                                                        containerSecurity._id
                                                                    }
                                                                    projectId={
                                                                        projectId
                                                                    }
                                                                    componentId={
                                                                        componentId
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </span>
                                                );
                                            }
                                        )}
                                </ShouldRender>
                                <span>
                                    <div>
                                        <div>
                                            <ContainerSecurityForm
                                                componentId={componentId}
                                                projectId={projectId}
                                            />
                                        </div>
                                    </div>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }
}

Container.displayName = 'Container Security Page';

Container.propTypes = {
    projectId: PropTypes.string,
    componentId: PropTypes.string,
    containerSecurities: PropTypes.array,
    getContainerSecurities: PropTypes.func,
    getContainerSecurityLogs: PropTypes.func,
    gettingSecurityLogs: PropTypes.bool,
    gettingContainerSecurities: PropTypes.bool,
    location: PropTypes.shape({
        pathname: PropTypes.string,
    }),
    components: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
        })
    ),
    scanContainerSecuritySuccess: PropTypes.func,
    getContainerSecuritySuccess: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => {
    // ids from url
    const components = [];
    const { componentId, projectId } = ownProps.match.params;
    // filter to get the actual component
    state.component.componentList.components.map(item =>
        item.components.map(component => {
            if (String(component._id) === String(componentId)) {
                components.push(component);
            }
            return component;
        })
    );

    return {
        projectId,
        componentId,
        containerSecurities: state.security.containerSecurities,
        gettingSecurityLogs: state.security.getContainerSecurityLog.requesting,
        gettingContainerSecurities: state.security.getContainer.requesting,
        components,
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            getContainerSecurities,
            getContainerSecurityLogs,
            scanContainerSecuritySuccess,
            getContainerSecuritySuccess,
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(Container);
