import { react as bindCallbacks } from 'auto-bind';
import classNames from 'classnames/bind';
import { PopTab } from 'components/poptab/PopTab';
import { FlowDefinition, FlowDetails } from 'flowTypes';
import React from 'react';

import styles from './LinksExplorer.module.scss';
import i18n from 'config/i18n';
import { PopTabType } from 'config/interfaces';
import { AssetStore } from '../../store/flowContext';
import dateFormat from 'dateformat';
import { renderIf } from '../../utils';
import Loading from '../loading/Loading';
import mutate from 'immutability-helper';

const cx: any = classNames.bind(styles);

export interface User {
  email: string;
  name: string;
}

export interface LinkData {
  nodeUUID: string;
  actionUUID: string;
  link: string;
  error?: string;
  statusCode?: number;
  processing?: boolean;
}

export interface LinksExplorerProps {
  utc?: boolean;
  popped: string;
  position: string;
  assetStore: AssetStore;
  definition: FlowDefinition;
  onToggled: (visible: boolean, tab: PopTabType) => void;
  onLinkClicked: (node_uuid: string, action_uuid: string) => void;
  loadFlowDefinition: (details: FlowDetails, assetStore: AssetStore) => void;
}

export interface LinksExplorerState {
  definition: FlowDefinition;
  visible: boolean;
  links: Array<LinkData>;
  lastRun?: string;
}

export class LinksExplorer extends React.Component<LinksExplorerProps, LinksExplorerState> {
  constructor(props: LinksExplorerProps) {
    super(props);

    this.state = {
      definition: null,
      visible: false,
      links: this.parseLinks(this.props.definition),
      lastRun: dateFormat(new Date(), 'mmmm d, yyyy, h:MM TT', this.props.utc)
    };

    bindCallbacks(this, {
      include: [/^handle/, /^render/]
    });
  }

  public componentDidMount() {
    this.validateLinks();
  }

  private detectURLs(text: string) {
    let urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return text.match(urlRegex);
  }

  private parseLinks(definition?: FlowDefinition) {
    let links = Array<LinkData>();
    try {
      definition.nodes.forEach(node => {
        node.actions.forEach(action => {
          if (action.type === 'send_msg') {
            // @ts-ignore
            this.detectURLs(action.text || '').forEach(textLink => {
              links.push({
                nodeUUID: node.uuid,
                actionUUID: action.uuid,
                link: textLink
              });
            });
          }
        });
      });
    } catch (e) {}
    return links;
  }

  private validateLinks() {
    this.state.links.forEach((link, index) => {
      let updated: any = mutate(this.state.links, {
        [index]: {
          $merge: { processing: true }
        }
      });
      this.setState({ links: updated });
      fetch(link.link, { method: 'GET', mode: 'no-cors', redirect: 'follow' })
        .then(response => {
          let updated: any = mutate(this.state.links, {
            [index]: {
              $merge: {
                processing: false,
                statusCode: response.statusText,
                error: response.status >= 400 ? response.statusText : ''
              }
            }
          });
          this.setState({ links: updated });
          console.log(updated);
        })
        .catch(error => {
          let updated: any = mutate(this.state.links, {
            [index]: {
              $merge: {
                processing: false,
                statusCode: 400,
                error: error.toString()
              }
            }
          });
          this.setState({ links: updated });
        });
    });
  }

  public handleTabClicked(): void {
    this.props.onToggled(!this.state.visible, PopTabType.LINKS_TAB);

    this.setState(
      (prevState: LinksExplorerState) => {
        return { visible: !prevState.visible };
      },
      () => {}
    );
  }

  public render(): JSX.Element {
    const classes = cx({
      [styles.visible]: this.state.visible,
      [styles.hidden]: this.props.popped && this.props.popped !== PopTabType.LINKS_TAB
    });

    return (
      <div className={classes}>
        <div className={styles.mask} />
        <PopTab
          header={i18n.t('links.header', 'Links')}
          color="#289f9b"
          icon="fe-link"
          label={i18n.t('links.label', 'Validate Links')}
          top={this.props.position}
          visible={this.state.visible}
          onShow={this.handleTabClicked}
          onHide={this.handleTabClicked}
        >
          <div className={styles.links_wrapper}>
            <div className={styles.links}>
              {this.state.links.map((link, key) => {
                return (
                  <div
                    className={styles.link}
                    key={key}
                    onClick={() => {
                      this.props.onLinkClicked(link.nodeUUID, link.actionUUID);
                    }}
                  >
                    {link.link}
                    {renderIf(!!link.statusCode)(
                      <a href={link.link} className={styles.status_code}>
                        {link.statusCode}
                      </a>
                    )}
                    {renderIf(!!link.processing)(<Loading size={3} units={3} color={'#289f9b'} />)}
                  </div>
                );
              })}
            </div>
            {/*<div className={styles.buttons}>*/}
            {/*  <div className={styles.last_updated}>Last run: {this.state.lastRun}</div>*/}
            {/*  <button className={styles.validate} onClick={() => {}}>{"Validate"}</button>*/}
            {/*</div>*/}
          </div>
        </PopTab>
      </div>
    );
  }
}
