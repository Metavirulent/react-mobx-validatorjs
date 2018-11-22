import * as React from 'react';
import * as ValidatorJS from 'validatorjs';
import {Errors} from 'validatorjs';
import {StoreModelValidator} from './StoreModelValidator';
import {LocalizationProvider} from './LocalizationProvider';
import {Provider} from 'mobx-react';

/**Configuration for the validator like what rules to enforce on what fields.*/
export interface ValidationConfig<T> {
    /**
     * Represents the data to be validated.
     * Can either be provided as part of the configuration (here)
     * or later from within the wrapped component via ({@link ModelValidator.setModel()}).
     */
    model?: T;
    /**
     * Rules to be enforced following the validatejs structure.
     * This typically has the same structure as the data, but instead of the actual values,
     * it contains a list of validator names separated by pipes,
     * e.g. <code>{name: 'required|string|between:5,20'}</code>.
     */
    rules: any;
    /**Keys for custom errors.
     * These will be translated via the localizationProvider.
     */
    customErrors?: ValidatorJS.ErrorMessages;
    /**
     * Keys for attribute names to localize.
     * These will be translated via a provided LocalizationProvider.
     */
    attributeNames?: ValidatorJS.AttributeNames;
    /**
     * If true, then validation will not be triggered automatically when the model changes.
     * Defaults to false.
     */
    manual?: boolean;
}

export type Validation<T> = ValidatorJS.Validator<T>;

export interface ModelValidator<T> {
    /**
     * Sets the data to be verified. Must be set prior to calling validation functions.
     */
    setModel(data: T);

    getModel(): T;

    /**
     * Reset the validation for this model.
     * This means that no fields are dirty anymore and thus no validation errors will be displayed.
     */
    reset();

    /**
     * Validate a particular field only.
     * This still performs a full validation but results are just displayed on the field.
     * Call this when a field changes or blurs.
     *
     * @param {string} field the name of the field.
     * @returns {boolean} true, if the field is valid.
     */
    validateField(field: string): boolean;

    /**
     * Validate the complete form.
     * Call this when the user is trying to submit the form.
     *
     * @returns {boolean} true, if the model is valid.
     */
    validateForm(): boolean;

    /**
     * Holds all current validatorjs errors.
     */
    errors: Errors;

    /**
     * Holds the number of errors.
     */
    errorCount: number;

    /**
     * Provides access to the current validation object.
     */
    validation: Validation<T>;

    /**
     * Returns the result of the last validation.
     * This always represents the whole model, not an individual field.
     * Can be used to disable Submit buttons, for example.
     * @returns {boolean} true, if the model was valid when last checked.
     */
    isValid: boolean;

    /**
     * Are we supposed to show errors on the given field right now?
     * This pretty much depends on whether the field has been validated.
     */
    showErrorsOnField(field: string): boolean;

    /**
     * Returns a map holding all fields that may show errors.
     */
    fieldsThatMayShowErrors: Map<string, boolean>;
}

/**Higher-order component wrapping the given component so it gets a validate prop injected.
 *
 * @param {React.ComponentClass<P>} WrappedComponent the wrapped component.
 * @param {ValidationConfig<T>} config validation config describing what to validate.
 * @returns the HOC wrapping the given component.
 */
export function withValidator<T, P>(
    WrappedComponent: React.ComponentClass<P>,
    config: ValidationConfig<T>,
    localizationProvider: LocalizationProvider | null | undefined
): React.ComponentClass<P> {
    class ValidatorProvider extends React.Component<P> {
        private readonly validator: ModelValidator<T>;

        constructor(props, ctx) {
            super(props, ctx);
            this.validator = new StoreModelValidator(config, localizationProvider);
        }

        public render() {
            const ValidatingWrappedComponent = WrappedComponent as React.ComponentClass<P>;
            return (
                <Provider validator={this.validator}>
                    <ValidatingWrappedComponent {...this.props}/>
                </Provider>
            );
        }
    }

    return ValidatorProvider;
}

/**Class decorator factory for validation.
 *
 * Make sure the validator decorator is used <em>before</em> the validator
 * is injected into the wrapped target or the validator will not (yet) be available.
 * If null, then no localization will occur.
 * @param {ValidationConfig<T>} config the configuration to use for validation.
 * @param {LocalizationProvider} localizationProvider used to adapt to your i18n system.
 * @returns {Function} the resulting class decorator.
 */
export function validator<T, P>(config: ValidationConfig<T>, localizationProvider?: LocalizationProvider): Function {
    return function (target: React.ComponentClass<P>) {
        return withValidator(target, config, localizationProvider);
    };
}
