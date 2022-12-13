import { react as bindCallbacks } from 'auto-bind';
import classNames from 'classnames/bind';
import { PopTab } from 'components/poptab/PopTab';
import { FlowDefinition, FlowDetails } from 'flowTypes';
import React from 'react';

import styles from './LinksExplorer.module.scss';
import i18n from 'config/i18n';
import { PopTabType } from 'config/interfaces';
import { AssetStore } from '../../store/flowContext';
import { renderIf } from '../../utils';
import Loading from '../loading/Loading';
import dateFormat from 'dateformat';

const cx: any = classNames.bind(styles);

export interface User {
  email: string;
  name: string;
}

export interface LinkData {
  node_uuid: string;
  action_uuid: string;
  link: string;
  error?: string;
  status_code?: number;
  processing?: boolean;
}

export interface LinksExplorerProps {
  utc?: boolean;
  popped: string;
  linksUrl: string;
  position: string;
  onToggled: (visible: boolean, tab: PopTabType) => void;
  onLinkClicked: (node_uuid: string, action_uuid: string) => void;
  loadFlowDefinition: (details: FlowDetails, assetStore: AssetStore) => void;
}

export interface LinksExplorerState {
  definition: FlowDefinition;
  visible: boolean;
  links: Array<LinkData>;
  lastRun?: string | Date;
}

export class LinksExplorer extends React.Component<LinksExplorerProps, LinksExplorerState> {
  constructor(props: LinksExplorerProps) {
    super(props);

    this.state = {
      definition: null,
      visible: false,
      links: [],
      lastRun: new Date()
    };

    bindCallbacks(this, {
      include: [/^handle/, /^render/]
    });
  }

  public componentDidMount() {
    fetch(this.props.linksUrl)
      .then(response => response.json())
      .then(data => {
        this.setState({ links: data.links });
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
                      this.props.onLinkClicked(link.node_uuid, link.action_uuid);
                    }}
                  >
                    {link.link}
                    {renderIf(!!link.status_code)(
                      <a
                        href={link.link}
                        target="_blank"
                        className={
                          styles.status_code +
                          ' ' +
                          (link.status_code >= 400 ? styles.error : styles.success)
                        }
                      >
                        {link.status_code}
                      </a>
                    )}
                    {renderIf(!!link.processing)(<Loading size={3} units={3} color={'#289f9b'} />)}
                  </div>
                );
              })}
            </div>
            <div className={styles.buttons}>
              <div className={styles.last_updated}>
                Last run: {dateFormat(this.state.lastRun, 'mmmm d, yyyy, h:MM TT', this.props.utc)}
              </div>
              <button className={styles.validate} onClick={() => {}}>
                {'Validate Links'}
              </button>
            </div>
          </div>
        </PopTab>
      </div>
    );
  }
}
