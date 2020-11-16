import { react as bindCallbacks } from 'auto-bind';
import Button from 'components/button/Button';
import { Canvas } from 'components/canvas/Canvas';
import { CanvasDraggableProps } from 'components/canvas/CanvasDraggable';
import Node from 'components/flow/node/Node';
import { getDraggedFrom } from 'components/helpers';
import NodeEditor from 'components/nodeeditor/NodeEditor';
import Simulator from 'components/simulator/Simulator';
import Sticky, { STICKY_BODY, STICKY_TITLE } from 'components/sticky/Sticky';
import { ConfigProviderContext, fakePropType } from 'config/ConfigProvider';
import { Exit, FlowDefinition, FlowMetadata } from 'flowTypes';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Plumber from 'services/Plumber';
import { DragSelection, EditorState } from 'store/editor';
import { RenderNode } from 'store/flowContext';
import { createEmptyNode, detectLoops, duplicateNode, getOrderedNodes } from 'store/helpers';
import { NodeEditorSettings, StringEntry } from 'store/nodeEditor';
import AppState from 'store/state';
import {
  ConnectionEvent,
  DispatchWithState,
  mergeEditorState,
  MergeEditorState,
  NoParamsAC,
  onConnectionDrag,
  OnConnectionDrag,
  OnOpenNodeEditor,
  onOpenNodeEditor,
  onRemoveNodes,
  OnRemoveNodes,
  OnUpdateCanvasPositions,
  onUpdateCanvasPositions,
  resetNodeEditingState,
  UpdateConnection,
  updateConnection,
  updateSticky,
  UpdateSticky
} from 'store/thunks';
import {
  createUUID,
  isRealValue,
  NODE_PADDING,
  renderIf,
  snapToGrid,
  timeEnd,
  timeStart
} from 'utils';
import Debug from 'utils/debug';

import styles from './Flow.module.scss';
import { Trans } from 'react-i18next';
import { PopTabType } from 'config/interfaces';
import { RefObject } from 'react';
import { ContextMenu } from 'components/contextmenu/ContextMenu';
import { TextInputElement } from 'components/form/textinput/TextInputElement';
import Modal from 'components/modal/Modal';
import Dialog from 'components/dialog/Dialog';

declare global {
  interface Window {
    fe: any;
  }
}

export interface FlowStoreProps {
  editorState: Partial<EditorState>;
  mergeEditorState: MergeEditorState;

  definition: FlowDefinition;
  nodes: { [uuid: string]: RenderNode };
  metadata: FlowMetadata;
  nodeEditorSettings: NodeEditorSettings;

  updateConnection: UpdateConnection;
  onOpenNodeEditor: OnOpenNodeEditor;
  onUpdateCanvasPositions: OnUpdateCanvasPositions;
  onRemoveNodes: OnRemoveNodes;
  resetNodeEditingState: NoParamsAC;
  onConnectionDrag: OnConnectionDrag;
  updateSticky: UpdateSticky;
}

export interface FlowStoreState {
  isClipboardAvailable?: boolean;
  displayClipboardBuffer?: boolean;
  clipboardBuffer?: StringEntry;
  pastingModalCallback?: () => void;
}

export interface Translations {
  [uuid: string]: any;
}

export const DRAG_THRESHOLD = 3;
export const REPAINT_TIMEOUT = 500;
export const GHOST_POSITION_INITIAL = { left: -1000, top: -1000 };

export const nodeSpecId = 'node';
export const nodesContainerSpecId = 'node-container';
export const ghostNodeSpecId = 'ghost-node';
export const dragSelectSpecId = 'drag-select';

export const isDraggingBack = (event: ConnectionEvent) => {
  return event.suspendedElementId === event.targetId && event.source !== null;
};

export const getDragStyle = (drag: DragSelection) => {
  const left = Math.min(drag.startX, drag.currentX);
  const top = Math.min(drag.startY, drag.currentY);
  const width = Math.max(drag.startX, drag.currentX) - left;
  const height = Math.max(drag.startY, drag.currentY) - top;
  return {
    left,
    top,
    width,
    height
  };
};

export class Flow extends React.Component<FlowStoreProps, FlowStoreState> {
  private Plumber: Plumber;
  private ele: HTMLDivElement;
  private nodeContainerUUID: string;

  // Refs
  private ghost: any;

  public static contextTypes = {
    config: fakePropType
  };

  constructor(props: FlowStoreProps, context: ConfigProviderContext) {
    super(props, context);

    this.nodeContainerUUID = createUUID();

    this.Plumber = new Plumber();
    this.state = { clipboardBuffer: { value: '' } };

    /* istanbul ignore next */
    if (context.config.debug) {
      window.fe = new Debug(props, this.props.editorState.debug);
    }

    bindCallbacks(this, {
      include: [/Ref$/, /^on/, /^is/, /^get/]
    });

    timeStart('RenderAndPlumb');
  }

  private onRef(ref: HTMLDivElement): HTMLDivElement {
    return (this.ele = ref);
  }

  private ghostRef(ref: any): any {
    return (this.ghost = ref);
  }

  public componentDidMount(): void {
    this.Plumber.bind('connection', (event: ConnectionEvent) =>
      this.props.updateConnection(event.sourceId, event.targetId)
    );
    this.Plumber.bind('beforeDrag', (event: ConnectionEvent) => {
      this.beforeConnectionDrag(event);
    });

    this.Plumber.bind('connectionDrag', (event: ConnectionEvent) => {
      if (this.context.config.mutable) {
        this.props.onConnectionDrag(event, this.context.config.flowType);
      }
    });

    this.Plumber.bind('connectionDragStop', (event: ConnectionEvent) =>
      this.onConnectorDrop(event)
    );
    this.Plumber.bind(
      'beforeStartDetach',
      (event: ConnectionEvent) => !this.props.editorState.translating && this.context.config.mutable
    );
    this.Plumber.bind('beforeDetach', (event: ConnectionEvent) => true);
    this.Plumber.bind('beforeDrop', (event: ConnectionEvent) => {
      if (this.context.config.mutable) {
        return this.onBeforeConnectorDrop(event);
      }
    });

    let offset = { left: 0, top: 0 };

    /* istanbul ignore next */
    if (this.ele) {
      offset = this.ele.getBoundingClientRect();
    }

    this.props.mergeEditorState({
      containerOffset: { left: offset.left, top: offset.top + window.scrollY }
    });

    timeEnd('RenderAndPlumb');

    // deals with safari load rendering throwing
    // off the jsplumb offsets
    window.setTimeout(() => this.Plumber.repaint(), REPAINT_TIMEOUT);
  }

  public componentWillUnmount(): void {
    this.Plumber.reset();
  }

  /**
   * Called right before a connector is dropped onto a new node
   */
  private onBeforeConnectorDrop(event: ConnectionEvent): boolean {
    this.props.resetNodeEditingState();
    const fromNodeUUID = event.sourceId.split(':')[0];
    try {
      detectLoops(this.props.nodes, fromNodeUUID, event.targetId);
    } catch {
      return false;
    }
    return true;
  }

  /**
   * Called the moment a connector is done dragging, whether it is dropped on an
   * existing node or on to empty space.
   */
  private onConnectorDrop(event: ConnectionEvent): boolean {
    const { ghostNode } = this.props.editorState;

    // Don't show the node editor if we a dragging back to where we were
    if (isRealValue(ghostNode) && !isDraggingBack(event)) {
      // Wire up the drag from to our ghost node
      this.Plumber.recalculate(ghostNode.node.uuid);

      const dragPoint = getDraggedFrom(ghostNode);
      this.Plumber.connect(
        dragPoint.nodeUUID + ':' + dragPoint.exitUUID,
        ghostNode.node.uuid,
        connection => {}
      );

      // Save our position for later
      const { left, top } = (this.ghost &&
        snapToGrid(this.ghost.ele.offsetLeft, this.ghost.ele.offsetTop)) || { left: 0, top: 0 };

      this.props.editorState.ghostNode.ui.position = { left, top };
      let originalAction = null;
      if (ghostNode.node.actions && ghostNode.node.actions.length === 1) {
        originalAction = ghostNode.node.actions[0];
      }

      // Bring up the node editor
      this.props.onOpenNodeEditor({
        originalNode: ghostNode,
        originalAction
      });
    }

    if (isDraggingBack(event)) {
      this.props.mergeEditorState({ ghostNode: null });
    }

    /* istanbul ignore next */
    document.removeEventListener('mousemove', (window as any).ghostListener);

    return true;
  }

  private beforeConnectionDrag(event: ConnectionEvent): boolean {
    if (event.source) {
      event.source.dispatchEvent(new Event('disconnect'));
    }
    return !this.props.editorState.translating;
  }

  private getNodes(): CanvasDraggableProps[] {
    const onlyNode = Object.keys(this.props.nodes).length === 1;
    return getOrderedNodes(this.props.nodes).map((renderNode: RenderNode, idx: number) => {
      return {
        uuid: renderNode.node.uuid,
        position: renderNode.ui.position,
        ele: (selected: boolean) => (
          <Node
            onlyNode={onlyNode}
            startingNode={idx === 0}
            selected={selected}
            key={renderNode.node.uuid}
            data-spec={nodeSpecId}
            nodeUUID={renderNode.node.uuid}
            onNodeCopyClick={() => this.copyNodeToClipboard(renderNode.node.uuid)}
            plumberMakeTarget={this.Plumber.makeTarget}
            plumberRemove={this.Plumber.remove}
            plumberRecalculate={this.Plumber.recalculate}
            plumberMakeSource={this.Plumber.makeSource}
            plumberConnectExit={this.Plumber.connectExit}
            plumberUpdateClass={this.Plumber.updateClass}
          />
        )
      };
    });
  }

  private copyNodeToClipboard(nodeUUID: string) {
    let node = this.props.nodes[nodeUUID];
    node.inboundConnections = {};
    navigator.clipboard.writeText(JSON.stringify(node)).then(() => console.log('Copied!'));
  }

  private pasteNodeFromClipbord(left: number, top: number): void {
    let callback = () => {
      if (
        !this.state.clipboardBuffer.validationFailures ||
        this.state.clipboardBuffer.validationFailures.length === 0
      ) {
        this.processCreatingOfNewFlowStep(left, top, this.state.clipboardBuffer.value);
        this.setState({
          displayClipboardBuffer: false,
          clipboardBuffer: { value: '' }
        });
      }
    };
    try {
      navigator.clipboard
        .readText()
        .then(text => this.processCreatingOfNewFlowStep(left, top, text))
        .catch(() => {
          this.setState({
            displayClipboardBuffer: true,
            pastingModalCallback: callback
          });
        });
    } catch {
      this.setState({
        displayClipboardBuffer: true,
        pastingModalCallback: callback
      });
    }
  }

  private processCreatingOfNewFlowStep(left: number, top: number, text: string): void {
    try {
      let nodeData: RenderNode = JSON.parse(text);
      if (!(nodeData.ui && nodeData.node)) {
        throw Error('Failed to paste node!');
      }
      let duplicatedNode = duplicateNode(nodeData);
      duplicatedNode.ui.position.left = left;
      duplicatedNode.ui.position.top = top;
      this.props.onOpenNodeEditor({
        originalNode: duplicatedNode,
        originalAction: duplicatedNode.node.actions.length ? duplicatedNode.node.actions[0] : null
      });
    } catch {
      this.props.mergeEditorState({
        modalMessage: {
          title: "Can't create a flow step.",
          body: 'There are no valid data to be pasted. Please copy one of the flow steps first.'
        },
        saving: false
      });
    }
  }

  private chackIsPasteAvailable(): void {
    try {
      navigator.clipboard
        .readText()
        .then(text => {
          this.setState({ isClipboardAvailable: this.validateStringifiedNode(text) });
        })
        .catch(() => {
          this.setState({ isClipboardAvailable: true });
        });
    } catch {
      this.setState({ isClipboardAvailable: true });
    }
  }

  private validateStringifiedNode(text: string): boolean {
    try {
      let nodeData: RenderNode = JSON.parse(text);
      if (!(nodeData.ui && nodeData.node)) {
        throw Error('No node found in the clipboard!');
      }
      return true;
    } catch {
      return false;
    }
  }

  private getStickies(): CanvasDraggableProps[] {
    const stickyMap = this.props.definition._ui.stickies || {};
    return Object.keys(stickyMap).map(uuid => {
      return {
        uuid,
        ele: (selected: boolean) => (
          <Sticky
            key={uuid}
            uuid={uuid}
            sticky={stickyMap[uuid]}
            selected={selected}
            mutable={this.context.config.mutable}
          />
        ),
        position: stickyMap[uuid].position
      };
    });
  }

  private getDragNode(): JSX.Element {
    return isRealValue(this.props.editorState.ghostNode) ? (
      <div
        data-spec={ghostNodeSpecId}
        key={this.props.editorState.ghostNode.node.uuid}
        style={{ position: 'absolute', display: 'block', visibility: 'hidden' }}
      >
        <Node
          onlyNode={false}
          selected={false}
          startingNode={false}
          ref={this.ghostRef}
          ghost={true}
          nodeUUID={this.props.editorState.ghostNode.node.uuid}
          plumberMakeTarget={this.Plumber.makeTarget}
          plumberRemove={this.Plumber.remove}
          plumberRecalculate={this.Plumber.recalculate}
          plumberMakeSource={this.Plumber.makeSource}
          plumberConnectExit={this.Plumber.connectExit}
          plumberUpdateClass={this.Plumber.updateClass}
        />
      </div>
    ) : null;
  }

  private getSimulator(): JSX.Element {
    return renderIf(this.context.config.endpoints && this.context.config.endpoints.simulateStart)(
      <Simulator
        key="simulator"
        popped={this.props.editorState.popped}
        mergeEditorState={this.props.mergeEditorState}
        onToggled={(visible: boolean, tab: PopTabType) => {
          this.props.mergeEditorState({
            popped: visible ? tab : null
          });
        }}
      />
    );
  }

  private getNodeEditor(): JSX.Element {
    return renderIf(this.props.nodeEditorSettings !== null)(
      <NodeEditor
        key="node-editor"
        helpArticles={this.context.config.help}
        plumberConnectExit={this.Plumber.connectExit}
        plumberRepaintForDuration={this.Plumber.repaintForDuration}
      />
    );
  }

  private isClickOnCanvas(event: React.MouseEvent<HTMLDivElement>): boolean {
    // TODO: not sure the TS-safe way to access id here
    return (event.target as any).id === this.nodeContainerUUID;
  }

  private onDoubleClick(event: React.MouseEvent<HTMLDivElement>): void {
    if (!this.context.config.mutable) return;
    if (this.isClickOnCanvas(event)) {
      const { left, top } = snapToGrid(
        event.pageX - this.props.editorState.containerOffset.left - 100 + NODE_PADDING,
        event.pageY - this.props.editorState.containerOffset.top - NODE_PADDING * 2 - 40
      );

      this.props.updateSticky(createUUID(), {
        position: { left, top },
        title: STICKY_TITLE,
        body: STICKY_BODY
      });
    }
  }

  private getEmptyFlow(): JSX.Element {
    return (
      <div key="create_node" className={styles.empty_flow}>
        <Trans i18nKey="empty_flow_message">
          <h1>Let's get started</h1>
          <div>
            We recommend starting your flow by sending a message. This message will be sent to
            anybody right after they join the flow. This is your chance to send a single message or
            ask them a question.
          </div>
        </Trans>

        <Button
          name="Create Message"
          onClick={() => {
            const emptyNode = createEmptyNode(null, null, 1, this.context.config.flowType);
            this.props.onOpenNodeEditor({
              originalNode: emptyNode,
              originalAction: emptyNode.node.actions[0]
            });
          }}
        />
      </div>
    );
  }

  private getContextMenu(reference: RefObject<any>): JSX.Element {
    let menuItems = [
      {
        label: 'Create Message',
        onClick: (event: MouseEvent) => {
          // @ts-ignore
          const flowEditor = event.currentTarget.parentElement.parentElement;
          const emptyNode = createEmptyNode(null, null, 1, this.context.config.flowType);
          emptyNode.ui.position.left = event.pageX - flowEditor.offsetLeft - 50 || 0;
          emptyNode.ui.position.top = event.pageY - flowEditor.offsetTop - 250 || 0;
          this.props.onOpenNodeEditor({
            originalNode: emptyNode,
            originalAction: emptyNode.node.actions[0]
          });
        }
      },
      {
        label: 'Paste Step',
        hidden: !this.state.isClipboardAvailable,
        onClick: (event: MouseEvent) => {
          // @ts-ignore
          const flowEditor = event.currentTarget.parentElement.parentElement;
          let left = event.pageX - flowEditor.offsetLeft - 50 || 0;
          let top = event.pageY - flowEditor.offsetTop - 250 || 0;
          this.pasteNodeFromClipbord(left, top);
        }
      }
    ];
    return (
      <>
        <ContextMenu ref={reference} items={menuItems} />
        <Modal width="600px" show={this.state.displayClipboardBuffer}>
          <Dialog
            className={styles.alert_modal}
            title="Create Flow Step"
            headerClass="msg"
            buttons={{
              primary: {
                name: 'Ok',
                onClick: this.state.pastingModalCallback
              },
              secondary: {
                name: 'Cancel',
                onClick: () => this.setState({ displayClipboardBuffer: false })
              }
            }}
          >
            <div
              className={styles.alert_body}
              onContextMenu={e => {
                e.stopPropagation();
              }}
            >
              <div style={{ padding: '10px 0' }}>
                Paste the copied text in the box below to duplicate the flow step. You will see a
                long JSON string appear if you are successful. Click the OK button to complete the
                process.
              </div>
              <TextInputElement
                name=""
                showLabel={false}
                onChange={value =>
                  this.setState({
                    clipboardBuffer: {
                      value: value,
                      validationFailures: this.validateStringifiedNode(value)
                        ? []
                        : [{ message: 'Invalid flowstep data' }]
                    }
                  })
                }
                entry={this.state.clipboardBuffer}
                autocomplete={false}
                focus={true}
                textarea={true}
                typeConfig={null}
                assetStore={null}
                completionSchema={null}
                functions={null}
              />
            </div>
          </Dialog>
        </Modal>
      </>
    );
  }

  public render(): JSX.Element {
    const nodes = this.getNodes();

    let children = [];

    if (nodes.length === 0) {
      children = [this.getEmptyFlow()];
    } else {
      children = [this.getSimulator(), this.getDragNode()];
    }

    const draggables = this.getStickies().concat(nodes);
    const contextMenu = React.createRef<any>();

    return (
      <div
        onDoubleClick={this.onDoubleClick}
        ref={this.onRef}
        style={{ minWidth: document.body.scrollWidth }}
        onContextMenu={e => {
          if (this.context.config.mutable && !this.props.editorState.translating) {
            this.chackIsPasteAvailable();
            contextMenu.current.show(e);
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <Canvas
          mutable={this.context.config.mutable}
          draggingNew={!!this.props.editorState.ghostNode && !this.props.nodeEditorSettings}
          onDragging={(uuids: string[]) => {
            uuids.forEach((uuid: string) => {
              if (uuid in this.props.nodes) {
                this.props.nodes[uuid].node.exits.forEach((exit: Exit) => {
                  if (exit.destination_uuid) {
                    uuids.push(uuid + ':' + exit.uuid);
                  }
                });
              }
            });
            this.Plumber.recalculateUUIDs(uuids);
          }}
          uuid={this.nodeContainerUUID}
          dragActive={this.props.editorState.dragActive}
          mergeEditorState={this.props.mergeEditorState}
          onRemoveNodes={this.props.onRemoveNodes}
          draggables={draggables}
          onUpdatePositions={this.props.onUpdateCanvasPositions}
        >
          {children}
          {this.getNodeEditor()}
          {this.getContextMenu(contextMenu)}
        </Canvas>
      </div>
    );
  }
}

/* istanbul ignore next */
const mapStateToProps = ({
  flowContext: { definition, metadata, nodes },
  // tslint:disable-next-line: no-shadowed-variable
  editorState,
  nodeEditor: { settings }
}: AppState) => {
  return {
    nodeEditorSettings: settings,
    definition,
    nodes,
    metadata,
    editorState: editorState as Partial<EditorState>
  };
};

/* istanbul ignore next */
const mapDispatchToProps = (dispatch: DispatchWithState) =>
  bindActionCreators(
    {
      mergeEditorState,
      resetNodeEditingState,
      onConnectionDrag,
      onOpenNodeEditor,
      onUpdateCanvasPositions,
      onRemoveNodes,
      updateConnection,
      updateSticky
    },
    dispatch
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Flow);
