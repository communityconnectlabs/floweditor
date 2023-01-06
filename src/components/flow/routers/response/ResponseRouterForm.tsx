/* eslint-disable react/jsx-key */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { react as bindCallbacks } from 'auto-bind';
import * as React from 'react';
import i18n from 'config/i18n';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { hasErrors, renderIssues } from 'components/flow/actions/helpers';
import { RouterFormProps } from 'components/flow/props';
import CaseList, { CaseProps } from 'components/flow/routers/caselist/CaseList';
import {
  ALLOWED_AUTO_TESTS,
  ALLOWED_TESTS,
  ResponseTestCase,
  ResponseTestCaseType,
  generateAutomatedTest,
  getLocalizedCases,
  matchResponseTextWithCategory,
  nodeToState,
  stateToNode,
  TimezoneData
} from 'components/flow/routers/response/helpers';
import { createResultNameInput } from 'components/flow/routers/widgets';
import TimeoutControl from 'components/form/timeout/TimeoutControl';
import TypeList from 'components/nodeeditor/TypeList';
import { FormState, StringEntry } from 'store/nodeEditor';
import { Alphanumeric, StartIsNonNumeric, validate } from 'store/validators';
import { WAIT_LABEL } from 'components/flow/routers/constants';
import { SpellChecker } from 'components/spellchecker/SpellChecker';
import { fakePropType } from 'config/ConfigProvider';
import styles from './ResponseRouterForm.module.scss';
import { SelectOption } from 'components/form/select/SelectElement';
import TextInputElement from 'components/form/textinput/TextInputElement';
import Pill from 'components/pill/Pill';
import Button, { ButtonTypes } from 'components/button/Button';
import CheckboxElement from 'components/form/checkbox/CheckboxElement';
import mutate from 'immutability-helper';
import TembaSelect, { TembaSelectStyle } from '../../../../temba/TembaSelect';

// TODO: Remove use of Function
// tslint:disable:ban-types
export enum InputToFocus {
  args = 'args',
  min = 'min',
  max = 'max',
  exit = 'exit'
}

interface TestingFormState {
  testingLang?: SelectOption;
  testingLangs?: SelectOption[];
  liveTestText?: StringEntry;
  localizedCases?: { [lang: string]: CaseProps[] };
  responseTestCases?: { [lang: string]: ResponseTestCase[] };
  activeLocalizations?: Set<string>;
  testResults?: { [lang: string]: boolean };
  timezoneData?: TimezoneData;
}

export interface ResponseRouterFormState extends FormState, TestingFormState {
  cases: CaseProps[];
  resultName: StringEntry;
  timeout: number;
  enabledSpell: boolean;
  spellSensitivity: string;
}

export const leadInSpecId = 'lead-in';

export default class ResponseRouterForm extends React.Component<
  RouterFormProps,
  ResponseRouterFormState
> {
  public constructor(props: RouterFormProps) {
    super(props);

    this.state = nodeToState(this.props.nodeSettings, this.props);

    bindCallbacks(this, {
      include: [/^on/, /^handle/]
    });
  }

  public static contextTypes = {
    config: fakePropType
  };

  private handleUpdateResultName(value: string): void {
    const resultName = validate(i18n.t('forms.result_name', 'Result Name'), value, [
      Alphanumeric,
      StartIsNonNumeric
    ]);

    const invalidCase = !!this.state.cases.find((caseProps: CaseProps) => !caseProps.valid);
    this.setState({
      resultName,
      valid: !invalidCase && !hasErrors(resultName)
    });
  }

  private handleUpdateTimeout(timeout: number): void {
    this.setState({ timeout });
  }

  private handleCasesUpdated(cases: CaseProps[]): void {
    const invalidCase = cases.find((caseProps: CaseProps) => !caseProps.valid);
    const recreateLocalizedCases = (localizedCases: any, language: SelectOption) => {
      localizedCases[language.value] = getLocalizedCases(cases, this.props, language.value);
      return localizedCases;
    };
    const localizedCases = this.state.testingLangs.reduce(recreateLocalizedCases, {});
    const nameErrors = hasErrors(this.state.resultName);
    this.setState({ cases, localizedCases, valid: !invalidCase && !nameErrors });
    this.retestAutomatedTestCases();
  }

  private handleSave(): void {
    // retest all cases and show error if some of them are failed or unconfirmed
    const resultOfTesting = this.retestAutomatedTestCases();
    if (
      !Object.entries(resultOfTesting)
        .filter(([localization]) => this.state.activeLocalizations.has(localization))
        .every(([, testingResult]) => testingResult)
    ) {
      let message = '';
      if (
        !this.state.responseTestCases[this.state.testingLang.value].every(
          testCase => testCase.actualCategory === testCase.confirmedCategory
        )
      ) {
        message = 'Test cases have not been confirmed or contain failures.';
      } else {
        message = 'You have unconfirmed test results. Please confirm the results before saving.';
      }

      this.props.mergeEditorState({
        modalMessage: {
          title: "This data can't be saved",
          body: message
        },
        saving: false
      });
      let firstFailedLanguage = Object.entries(resultOfTesting).find(
        ([localization, testingResult]) =>
          this.state.activeLocalizations.has(localization) && !testingResult
      )[0];
      this.setState({
        testingLang: this.state.testingLangs.find(lang => lang.value === firstFailedLanguage)
      });
      return;
    }
    if (this.state.valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
      this.props.onClose(false);
    }
  }

  private getButtons(): ButtonSet {
    return {
      primary: { name: i18n.t('buttons.ok', 'Ok'), onClick: this.handleSave },
      secondary: {
        name: i18n.t('buttons.cancel', 'Cancel'),
        onClick: () => this.props.onClose(true)
      }
    };
  }

  private onEnabledChange(): void {
    this.setState(prevState => ({ enabledSpell: !prevState.enabledSpell }));
  }

  private onSensitivityChange(event: React.FormEvent<HTMLInputElement>): void {
    this.setState({ spellSensitivity: event.currentTarget.value });
  }

  private renderSpellChecker(): JSX.Element {
    if (!(this.context.config.filters || []).find((name: string) => name === 'spell_checker')) {
      return (
        <SpellChecker
          enabledSpell={this.state.enabledSpell}
          onEnabledChange={this.onEnabledChange}
          spellSensitivity={this.state.spellSensitivity}
          onSensitivityChange={this.onSensitivityChange}
        />
      );
    }
  }

  private onAddTestCaseClicked() {
    let matched = this.state.liveTestText
      ? matchResponseTextWithCategory(
          this.state.liveTestText.value,
          this.state.localizedCases[this.state.testingLang.value],
          this.state.timezoneData
        )
      : [];
    let automatedTestCases = this.state.responseTestCases;
    const testAlreadyExists = automatedTestCases[this.state.testingLang.value]
      .filter(test => !test.deleted)
      .some(item => item.testText === this.state.liveTestText.value);
    if (matched.length > 0 && !testAlreadyExists) {
      const updated: any = mutate(automatedTestCases[this.state.testingLang.value], {
        $push: [
          {
            type: ResponseTestCaseType.USER_GENERATED,
            testText: this.state.liveTestText.value,
            actualCategory: matched.join(', '),
            confirmedCategory: matched.join(', '),
            confirmed: false
          }
        ]
      });
      automatedTestCases[this.state.testingLang.value] = updated;
      this.setState({ responseTestCases: automatedTestCases, liveTestText: { value: '' } });
    }
  }

  private onConfirmTestCaseClicked(index: number, value: boolean) {
    let dataToChange = { confirmed: value };
    let automatedTestCases = this.state.responseTestCases;
    if (value) {
      // @ts-ignore
      dataToChange.confirmedCategory =
        automatedTestCases[this.state.testingLang.value][index].actualCategory;
    }
    const updated: any = mutate(automatedTestCases[this.state.testingLang.value], {
      [index]: { $merge: dataToChange }
    });
    automatedTestCases[this.state.testingLang.value] = updated;
    this.setState({ responseTestCases: automatedTestCases });
  }

  private onConfirmAllClicked() {
    let automatedTests = this.state.responseTestCases;
    automatedTests[this.state.testingLang.value].forEach(item => {
      item.confirmed = true;
      item.confirmedCategory = item.actualCategory;
    });
    this.setState({ responseTestCases: automatedTests });
  }

  private onUnconfirmAllClicked() {
    let automatedTests = this.state.responseTestCases;
    automatedTests[this.state.testingLang.value].forEach(item => (item.confirmed = false));
    this.setState({ responseTestCases: automatedTests });
  }

  private onDeleteTestCaseClicked(index: number) {
    let dataToChange = { deleted: true };
    let automatedTestCases = this.state.responseTestCases;
    const updated: any = mutate(automatedTestCases[this.state.testingLang.value], {
      [index]: { $merge: dataToChange }
    });
    automatedTestCases[this.state.testingLang.value] = updated;
    this.setState({ responseTestCases: automatedTestCases });
  }

  private onDeleteAllCkicked() {
    let automatedTests = this.state.responseTestCases;
    automatedTests[this.state.testingLang.value].forEach(item => (item.deleted = true));
    this.setState({ responseTestCases: automatedTests });
  }

  private retestAutoGeneratedTests(lang: SelectOption) {
    let retestedTestCases: ResponseTestCase[] = [];
    let testCases = this.state.responseTestCases[lang.value].filter(
      item => item.type === ResponseTestCaseType.AUTO_GENERATED
    );
    let testCasesMap = Object.assign({}, ...testCases.map(item => ({ [item.testText]: item })));
    let allCases = this.state.localizedCases[lang.value];
    let cases = this.state.localizedCases[lang.value].filter(case_ =>
      ALLOWED_AUTO_TESTS.includes(case_.kase.type)
    );
    cases.forEach(item => {
      if (item.kase.arguments[0] === '') return;
      if (item.kase.arguments[0] in testCasesMap) {
        let testCase = testCasesMap[item.kase.arguments[0]];
        if (item.categoryName !== testCase.confirmedCategory) {
          let previousCase = testCase;
          testCase = generateAutomatedTest(
            item,
            this.state.localizedCases[lang.value],
            this.state.timezoneData
          );
          if (testCase.actualCategory === previousCase.actualCategory && previousCase.confirmed) {
            if (allCases.some(case_ => case_.categoryName === previousCase.confirmedCategory)) {
              testCase.confirmedCategory = previousCase.confirmedCategory;
              testCase.confirmed = previousCase.confirmed;
              testCase.deleted = previousCase.deleted;
            }
          }
        } else {
          let matched = testCase.testText
            ? matchResponseTextWithCategory(
                testCase.testText,
                this.state.localizedCases[lang.value],
                this.state.timezoneData
              )
            : [];
          let newActualCategory = matched.join(', ');
          testCase.confirmed =
            newActualCategory === testCase.actualCategory ? testCase.confirmed : false;
          testCase.actualCategory = newActualCategory;
        }
        retestedTestCases.push(testCase);
      } else {
        let testCase = generateAutomatedTest(
          item,
          this.state.localizedCases[lang.value],
          this.state.timezoneData
        );
        retestedTestCases.push(testCase);
      }
    });
    return retestedTestCases;
  }

  private retestManualyGeneratedTests(lang: SelectOption) {
    let alreadyCreatedManalTests = this.state.responseTestCases[lang.value].filter(
      item => item.type === ResponseTestCaseType.USER_GENERATED
    );
    alreadyCreatedManalTests.forEach(item => {
      let matched = item.testText
        ? matchResponseTextWithCategory(
            item.testText,
            this.state.localizedCases[lang.value],
            this.state.timezoneData
          )
        : [];
      let newActualCategory = matched.join(',');
      item.confirmed = newActualCategory === item.actualCategory ? item.confirmed : false;
      item.actualCategory = newActualCategory;
    });
    return alreadyCreatedManalTests;
  }

  private retestAutomatedTestCases() {
    let automatedTestCases = this.state.responseTestCases;
    let testResults = this.state.testResults;
    this.state.testingLangs.forEach(language => {
      let automatedTests = this.retestAutoGeneratedTests(language);
      let manualTests = this.retestManualyGeneratedTests(language);
      let allTests = [...automatedTests, ...manualTests];
      let errored = allTests.filter(item => item.actualCategory !== item.confirmedCategory);
      let unconfirmed = allTests.filter(
        item => item.actualCategory === item.confirmedCategory && !item.confirmed
      );
      let confirmed = allTests.filter(
        item => item.actualCategory === item.confirmedCategory && item.confirmed
      );
      automatedTestCases[language.value] = [...errored, ...unconfirmed, ...confirmed];
      let allTestsPassedAndConfirmed = automatedTestCases[language.value]
        .filter(testCase => !testCase.deleted)
        .every(
          testCase => testCase.confirmed && testCase.actualCategory === testCase.confirmedCategory
        );
      testResults[language.value] = allTestsPassedAndConfirmed;
    });
    this.setState({ responseTestCases: automatedTestCases, testResults });
    return testResults;
  }

  private onTestingLangChanged(lang: any) {
    this.setState({ testingLang: lang });
  }

  private renderTestingTab(): JSX.Element {
    let matched = this.state.liveTestText
      ? matchResponseTextWithCategory(
          this.state.liveTestText.value,
          this.state.localizedCases[this.state.testingLang.value],
          this.state.timezoneData
        )
      : [];
    let filteredCases = this.state.localizedCases[this.state.testingLang.value].filter(case_ =>
      ALLOWED_TESTS.includes(case_.kase.type)
    );
    let cases = Object.assign(
      {},
      ...filteredCases.map(item => ({
        [item.categoryName]: {
          case: item,
          matched: matched.some(categoryName => categoryName === item.categoryName)
        }
      }))
    );

    return (
      <div className={styles.testingTab}>
        <div className={styles.liveTests}>
          <div className={styles.header}>Live Tests</div>
          <div className={styles.body}>
            <TembaSelect
              name="Language"
              value={this.state.testingLang}
              options={this.state.testingLangs.filter(lang =>
                this.state.activeLocalizations.has(lang.value)
              )}
              onChange={this.onTestingLangChanged}
              placeholder="Language"
              style={TembaSelectStyle.small}
            ></TembaSelect>
            <div className={styles.testLine}>
              <TextInputElement
                name="arguments"
                placeholder="Type text for testing"
                onChange={text => this.setState({ liveTestText: { value: text } })}
                entry={this.state.liveTestText}
              />
            </div>
            <div className={styles.categoriesContainer}>
              {Object.entries(cases).map(([key, value], index) => {
                // eslint-disable-next-line
                if (key === '') return;

                return (
                  <div
                    // @ts-ignore
                    className={value.matched ? styles.categoryMatched : styles.categoryName}
                    key={`category-${index}`}
                  >
                    <Pill large={true} text={key || 'Other'} />
                  </div>
                );
              })}
            </div>
            <div className={styles.buttons}>
              <Button
                name="Save Test"
                onClick={this.onAddTestCaseClicked}
                type={ButtonTypes.secondary}
              />
            </div>
          </div>
        </div>
        <div className={styles.automatedTests}>
          <div className={styles.header}>Automated Tests</div>
          <div className={styles.body}>
            <table>
              <thead>
                <tr>
                  <th>Test Text</th>
                  <th>Current Category</th>
                  <th>Confirm</th>
                  <th>Confirmed Category</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {this.state.responseTestCases[this.state.testingLang.value].map(
                  (test, index: number) =>
                    !test.deleted ? (
                      <tr
                        key={`test-case-${index}`}
                        className={
                          test.actualCategory === test.confirmedCategory
                            ? styles.testCorrect
                            : styles.testFailed
                        }
                      >
                        <td>
                          <p className={styles.text} title={test.testText}>
                            {test.testText}
                          </p>
                        </td>
                        <td className={styles.categoryName}>
                          <p className={styles.text} title={test.actualCategory}>
                            {test.actualCategory}
                          </p>
                        </td>
                        <td>
                          <CheckboxElement
                            name="checked"
                            checked={test.confirmed}
                            onChange={value => this.onConfirmTestCaseClicked(index, value)}
                          />
                        </td>
                        <td className={styles.categoryName}>
                          <p className={styles.text} title={test.confirmedCategory}>
                            {test.confirmedCategory}
                          </p>
                        </td>
                        <td>
                          <i
                            className="fe-x"
                            onClick={() => this.onDeleteTestCaseClicked(index)}
                          ></i>
                        </td>
                      </tr>
                    ) : (
                      <tr key={`test-case-${index}`}></tr>
                    )
                )}
              </tbody>
            </table>
            <div className={styles.buttons}>
              <Button
                name="Confirm All"
                onClick={this.onConfirmAllClicked}
                type={ButtonTypes.secondary}
              />
              <Button
                name="Unconfirm All"
                onClick={this.onUnconfirmAllClicked}
                type={ButtonTypes.secondary}
              />
              <Button
                name="Delete All"
                onClick={this.onDeleteAllCkicked}
                type={ButtonTypes.secondary}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  public renderEdit(): JSX.Element {
    const typeConfig = this.props.typeConfig;
    const checked = this.state.responseTestCases[this.state.testingLang.value]
      .filter(item => !item.deleted)
      .every(item => item.confirmed && item.actualCategory === item.confirmedCategory);
    let isTestingAvailable = this.state.cases.some(case_ => {
      return (
        ALLOWED_TESTS.includes(case_.kase.type) &&
        case_.kase.arguments &&
        ((case_.kase.arguments.length > 0 && case_.kase.arguments[0] !== '') ||
          case_.kase.arguments.length === 0)
      );
    });
    isTestingAvailable =
      isTestingAvailable || this.state.responseTestCases[this.state.testingLang.value].length > 0;
    const tabs = [
      {
        name: 'Test Responses',
        checked: checked,
        body: this.renderTestingTab(),
        hasErrors: !checked,
        icon: !checked ? 'fe-x' : null,
        onClick: () => {
          this.retestAutomatedTestCases();
        }
      }
    ];

    return (
      <Dialog
        title={typeConfig.name}
        headerClass={typeConfig.type}
        buttons={this.getButtons()}
        tabs={isTestingAvailable ? tabs : []}
        gutter={
          <TimeoutControl timeout={this.state.timeout} onChanged={this.handleUpdateTimeout} />
        }
      >
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        {this.renderSpellChecker()}
        <div>{WAIT_LABEL}</div>
        <CaseList
          data-spec="cases"
          cases={this.state.cases}
          onCasesUpdated={this.handleCasesUpdated}
        />
        {createResultNameInput(this.state.resultName, this.handleUpdateResultName)}
        {renderIssues(this.props)}
      </Dialog>
    );
  }

  public render(): JSX.Element {
    return this.renderEdit();
  }
}
