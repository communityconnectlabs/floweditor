import * as React from 'react';
import { react as bindCallbacks } from 'auto-bind';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { hasErrors } from 'components/flow/actions/helpers';
import { RouterFormProps } from 'components/flow/props';
import { nodeToState, stateToNode, LookupQueryEntry } from 'components/flow/routers/lookup/helpers';
import { createResultNameInput } from 'components/flow/routers/widgets';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import CheckboxElement from 'components/form/checkbox/CheckboxElement';
import TypeList from 'components/nodeeditor/TypeList';
import { Asset } from 'store/flowContext';
import { FormState, mergeForm, StringEntry, AssetEntry } from 'store/nodeEditor';
import {
  Alphanumeric,
  Required,
  shouldRequireIf,
  StartIsNonNumeric,
  validate
} from 'store/validators';
import { LookupParametersForm } from './LookupParametersForm';
import { LookQueryContext } from './Context';
import { validateLookupQuery } from './validators';

export interface LookupRouterFormState extends FormState {
  lookupDb: AssetEntry;
  lookupQueries: LookupQueryEntry[];
  returnAll: boolean;
  resultName: StringEntry;
}

export default class LookupRouterForm extends React.Component<
  RouterFormProps,
  LookupRouterFormState
> {
  constructor(props: RouterFormProps) {
    super(props);

    this.state = nodeToState(this.props.nodeSettings);
    bindCallbacks(this, {
      include: [/^on/, /^handle/]
    });
  }

  componentDidUpdate() {
    if (this.state.lookupQueries.length === 0) {
      this.setState({
        lookupQueries: [
          {
            field: { value: { id: '', text: '', type: 'String' } },
            rule: { value: { type: '', verbose_name: '' } },
            value: { value: '' }
          }
        ]
      });
    }
  }

  private addLookupQuery = () => {
    this.setState({
      lookupQueries: [
        ...this.state.lookupQueries,
        {
          field: { value: { id: '', text: '', type: 'String' } },
          rule: { value: { type: '', verbose_name: '' } },
          value: { value: '' }
        }
      ]
    });
  };

  private validateLookupQueries = (queries: LookupQueryEntry[]) => {
    return !queries.map(validateLookupQuery).find(query => {
      return hasErrors(query);
    });
  };

  private removeLookupQueries = (index: number) => {
    var lookupQueries = [...this.state.lookupQueries];
    lookupQueries.splice(index, 1);

    this.setState({
      lookupQueries,
      valid: this.validateLookupQueries(lookupQueries)
    });
  };

  private handleLookupQueries = (newQuery: LookupQueryEntry, index: number) => {
    var lookupQueries = [...this.state.lookupQueries];
    lookupQueries[index] = validateLookupQuery(newQuery);

    this.setState({
      lookupQueries,
      valid: this.validateLookupQueries(lookupQueries)
    });
  };

  private handleUpdateResultName(value: string): void {
    const updates: Partial<LookupRouterFormState> = {
      resultName: validate('Result Name', value, [Required, Alphanumeric, StartIsNonNumeric])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
  }

  private handleDbUpdate(selected: Asset[], submitting = false): boolean {
    const updates: Partial<LookupRouterFormState> = {
      lookupDb: validate('Lookup Database', selected[0], [shouldRequireIf(submitting)])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  }

  private handleUpdateReturnAll(value: boolean): void {
    const updates: Partial<LookupRouterFormState> = {
      returnAll: value
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
  }

  private handleSave(): void {
    // validate in case they never updated an empty field
    const updates: Partial<LookupRouterFormState> = {
      lookupDb: validate('Lookup Database', this.state.lookupDb.value, [Required]),
      resultName: validate('Result Name', this.state.resultName.value, [
        Alphanumeric,
        StartIsNonNumeric,
        Required
      ])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);

    if (this.state.valid && updated.valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
      this.props.onClose(false);
    }
  }

  private getButtons(): ButtonSet {
    return {
      primary: { name: 'Ok', onClick: this.handleSave, disabled: !this.state.valid },
      secondary: { name: 'Cancel', onClick: () => this.props.onClose(true) }
    };
  }

  public render(): JSX.Element {
    const typeConfig = this.props.typeConfig;

    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <div>Make some queries for lookup...</div>

        <AssetSelector
          name="Lookup Database"
          placeholder="Select the lookup collection"
          assets={this.props.assetStore.lookups}
          entry={this.state.lookupDb}
          searchable={true}
          onChange={this.handleDbUpdate}
          nameKey={'text'}
          valueKey={'id'}
        />
        {this.state.lookupDb.value.id && (
          <LookQueryContext.Provider
            value={{ deleteQuery: this.removeLookupQueries, updateQuery: this.handleLookupQueries }}
          >
            <LookupParametersForm
              queries={this.state.lookupQueries}
              onPressAdd={this.addLookupQuery}
              lookup={this.state.lookupDb}
              valid={this.validateLookupQueries(this.state.lookupQueries)}
              assetStore={this.props.assetStore}
            />
          </LookQueryContext.Provider>
        )}
        <div style={{ paddingTop: '10px' }}>
          <CheckboxElement
            name="Lookup Return All"
            checked={this.state.returnAll}
            description="Return all matches"
            onChange={this.handleUpdateReturnAll}
          />
        </div>
        {createResultNameInput(
          this.state.resultName,
          this.handleUpdateResultName,
          false,
          'The lookup will return responses in JSON format. Please use @webhook.result on the flow steps as a reference for each property.'
        )}
      </Dialog>
    );
  }
}
