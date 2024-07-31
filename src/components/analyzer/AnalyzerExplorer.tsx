import { react as bindCallbacks } from 'auto-bind';
import classNames from 'classnames/bind';
import { PopTab } from 'components/poptab/PopTab';
import React from 'react';

import styles from './AnalyzerExplorer.module.scss';
import i18n from 'config/i18n';
import { PopTabType } from 'config/interfaces';
import { renderIf } from '../../utils';
import Loading from '../loading/Loading';
import { FlowDefinition } from 'flowTypes';
import { AssetStore } from 'store/flowContext';

const cx: any = classNames.bind(styles);

export interface AnalyzerExplorerProps {
  popped: string;
  onToggled: (visible: boolean, tab: PopTabType) => void;
  definition: FlowDefinition;
  assetStore: AssetStore;
}

export interface AnalyzerExplorerState {
  visible: boolean;
  loading: boolean;
  text: string;
}

export class AnalyzerExplorer extends React.Component<
  AnalyzerExplorerProps,
  AnalyzerExplorerState
> {
  constructor(props: AnalyzerExplorerProps) {
    super(props);

    this.state = {
      visible: false,
      loading: true,
      text: ''
    };

    bindCallbacks(this, {
      include: [/^handle/, /^render/]
    });
  }

  private loadFlowComprehension(revisionID: number): void {
    fetch(`${this.props.assetStore.analyzer.endpoint}?revision=${revisionID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.props.definition)
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          loading: false,
          text: data.comprehension || 'Failed to load flow comprehension details.'
        });
      })
      .catch(() => {
        this.setState({
          loading: false,
          text: 'Failed to load flow comprehension details.'
        });
      });
  }

  public handleTabClicked(): void {
    this.props.onToggled(!this.state.visible, PopTabType.FLOW_ANALYZER);
    this.setState(
      (prevState: AnalyzerExplorerState) => {
        if (!prevState.visible) {
          fetch(this.props.assetStore.revisions.endpoint)
            .then(response => response.json())
            .then(data => {
              let currentRevisionID = data.results[0].id;
              this.loadFlowComprehension(currentRevisionID);
            })
            .catch(() => {
              this.loadFlowComprehension(0);
            });
        }
        return { visible: !prevState.visible };
      },
      () => {}
    );
  }

  public render(): JSX.Element {
    const classes = cx({
      [styles.visible]: this.state.visible,
      [styles.hidden]: this.props.popped && this.props.popped !== PopTabType.FLOW_ANALYZER
    });

    return (
      <div className={classes}>
        <div className={styles.mask} />
        <PopTab
          header={i18n.t('links.header', 'Flow Analyzer')}
          color="#1e90ff"
          icon="fe-help"
          label={i18n.t('links.label', 'Flow Analyzer')}
          top={'371px'}
          popTop={'-60px'}
          visible={this.state.visible}
          onShow={this.handleTabClicked}
          onHide={this.handleTabClicked}
          custom={false}
        >
          <div className={styles.analyzer_wrapper}>
            {renderIf(!!this.state.text)(<p className={styles.text}>{this.state.text}</p>)}
            {renderIf(this.state.loading)(
              <div className={styles.loading}>
                <Loading size={10} units={5} color={'#1e90ff'} />
              </div>
            )}
          </div>
        </PopTab>
      </div>
    );
  }
}
