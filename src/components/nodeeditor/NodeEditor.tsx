import { react as bindCallbacks } from 'auto-bind';
import { getDraggedFrom } from 'components/helpers';
import Modal from 'components/modal/Modal';
import { Type } from 'config/interfaces';
import { Action, AnyAction, FlowDefinition, FlowIssue } from 'flowTypes';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { UpdateUserAddingAction } from 'store/actionTypes';
import { Asset, AssetStore, RenderNode } from 'store/flowContext';
import { getOrderedNodes } from 'store/helpers';
import { NodeEditorSettings, updateUserAddingAction } from 'store/nodeEditor';
import AppState from 'store/state';
import {
  AddAsset,
  addAsset,
  DispatchWithState,
  GetState,
  HandleTypeConfigChange,
  handleTypeConfigChange,
  LocalizationUpdates,
  MergeEditorState,
  mergeEditorState,
  NoParamsAC,
  onUpdateAction,
  OnUpdateAction,
  OnUpdateLocalizations,
  onUpdateLocalizations,
  OnUpdateRouter,
  onUpdateRouter,
  resetNodeEditingState
} from 'store/thunks';
import { CompletionSchema } from 'utils/completion';
import { LocalizationFormProps } from 'components/flow/props';

export type UpdateLocalizations = (language: string, changes: LocalizationUpdates) => void;

// TODO: Remove use of Function
// tslint:disable:ban-types
export interface NodeEditorPassedProps {
  plumberConnectExit: Function;
  helpArticles: { [key: string]: string };
}

export interface NodeEditorStoreProps {
  assetStore: AssetStore;
  addAsset: AddAsset;
  language: Asset;
  definition: FlowDefinition;
  translating: boolean;
  typeConfig: Type;
  settings: NodeEditorSettings;
  nodes: { [uuid: string]: RenderNode };
  handleTypeConfigChange: HandleTypeConfigChange;
  resetNodeEditingState: NoParamsAC;
  issues: FlowIssue[];
  mergeEditorState: MergeEditorState;
  onUpdateLocalizations: OnUpdateLocalizations;
  onUpdateAction: OnUpdateAction;
  onUpdateRouter: OnUpdateRouter;
  updateUserAddingAction: UpdateUserAddingAction;
  completionSchema: CompletionSchema;
}

export type NodeEditorProps = NodeEditorPassedProps & NodeEditorStoreProps;

export interface FormProps {
  // our two ways of updating
  updateRouter(renderNode: RenderNode): void;
  updateAction(action: AnyAction): void;

  addAsset(assetType: string, asset: Asset): void;
  completionSchema: CompletionSchema;

  assetStore: AssetStore;
  issues: FlowIssue[];
  helpArticles: { [key: string]: string };

  nodeSettings?: NodeEditorSettings;
  typeConfig?: Type;
  onTypeChange?(config: Type): void;
  onClose?(canceled: boolean): void;

  mergeEditorState?: MergeEditorState;
}

/* export interface LocalizationProps {
  nodeSettings?: NodeEditorSettings;
  typeConfig?: Type;
  onClose?(canceled: boolean): void;

  issues: FlowIssue[];
  updateLocalizations: UpdateLocalizations;
  language: Asset;
}*/

export class NodeEditor extends React.Component<NodeEditorProps> {
  constructor(props: NodeEditorProps) {
    super(props);

    bindCallbacks(this, {
      include: [/^close/, /^update/, /^handle/]
    });
  }

  private updateLocalizations(language: string, changes: LocalizationUpdates) {
    this.props.onUpdateLocalizations(language, changes);
  }

  public close(canceled: boolean): void {
    // Make sure we re-wire the old connection
    if (canceled) {
      const dragPoint = getDraggedFrom(this.props.settings.originalNode);
      if (dragPoint) {
        const renderNode = this.props.nodes[dragPoint.nodeUUID];
        for (const exit of renderNode.node.exits) {
          if (exit.uuid === dragPoint.exitUUID) {
            // TODO: should this just be taking literal uuids instead of objects?
            this.props.plumberConnectExit(renderNode.node, exit);
            break;
          }
        }
      }
    }

    this.props.resetNodeEditingState();
    this.props.updateUserAddingAction(false);
  }

  private updateAction(
    action: Action,
    onUpdated?: (dispatch: DispatchWithState, getState: GetState) => void
  ): void {
    this.props.onUpdateAction(action, onUpdated);
  }

  private updateRouter(renderNode: RenderNode): void {
    this.props.onUpdateRouter(renderNode);
  }

  private handleAddAsset(assetType: string, asset: Asset): void {
    this.props.addAsset(assetType, asset);
  }

  public render(): JSX.Element {
    if (this.props.settings) {
      const { typeConfig } = this.props;

      // see if we should use the localization form
      if (this.props.translating) {
        const { localization: LocalizationForm } = typeConfig;

        if (LocalizationForm) {
          let flowLanguage = this.props.definition.language;
          if (!flowLanguage || flowLanguage === 'base') {
            flowLanguage = 'eng';
          }
          const localizationProps: LocalizationFormProps = {
            updateLocalizations: this.updateLocalizations,
            nodeSettings: this.props.settings,
            onClose: this.close,
            language: this.props.language,
            flowLanguage: flowLanguage,
            helpArticles: this.props.helpArticles,
            issues: this.props.issues.filter(
              (issue: FlowIssue) => issue.language === this.props.language.id
            )
          };

          return (
            <Modal width="600px" show={true}>
              <LocalizationForm {...{ ...localizationProps }} />
            </Modal>
          );
        }
      }

      const { form: Form } = typeConfig;
      const isStartingNode = Object.entries(this.props.nodes).length
        ? getOrderedNodes(this.props.nodes)[0].node.uuid ===
          this.props.settings.originalNode.node.uuid
        : true;

      const formProps: FormProps = {
        assetStore: this.props.assetStore,
        completionSchema: this.props.completionSchema,
        addAsset: this.handleAddAsset,
        updateAction: this.updateAction,
        updateRouter: this.updateRouter,
        nodeSettings: {
          isStartingNode,
          flowID: this.props.definition.uuid,
          localization: this.props.definition.localization,
          defaultLanguage: this.props.definition.language,
          ...this.props.settings
        },
        helpArticles: this.props.helpArticles,
        issues: this.props.issues.filter((issue: FlowIssue) => !issue.language),
        typeConfig: this.props.typeConfig,
        mergeEditorState: this.props.mergeEditorState,
        onTypeChange: this.props.handleTypeConfigChange,
        onClose: this.close
      };

      return (
        <Modal width="600px" show={true}>
          <Form {...{ ...formProps }} />
        </Modal>
      );
    }
    return null;
  }
}

/* istanbul ignore next */
const mapStateToProps = ({
  flowContext: { definition, nodes, assetStore, issues },
  editorState: { language, translating, completionSchema },
  nodeEditor: { typeConfig, settings }
}: AppState) => {
  const filteredIssues = (issues[settings.originalNode.node.uuid] || []).filter(
    (issue: FlowIssue) =>
      !settings.originalAction || settings.originalAction.uuid === issue.action_uuid
  );

  return {
    issues: filteredIssues,
    language,
    definition,
    nodes,
    translating,
    typeConfig,
    settings,
    assetStore,
    completionSchema
  };
};

/* istanbul ignore next */
const mapDispatchToProps = (dispatch: DispatchWithState) =>
  bindActionCreators(
    {
      addAsset,
      resetNodeEditingState,
      mergeEditorState,
      handleTypeConfigChange,
      onUpdateLocalizations,
      onUpdateAction,
      onUpdateRouter,
      updateUserAddingAction
    },
    dispatch
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NodeEditor);
