import * as ValidatorJS from 'validatorjs';
import {Errors} from 'validatorjs';
import {action, computed, IObjectDidChange, IReactionDisposer, isObservableMap, observable, observe} from 'mobx';
import {ModelValidator, Validation, ValidationConfig} from './ModelValidator';
import {NoopLocalizationProvider} from './NoopLocalizationProvider';

/**
 * A ModelValidator ready to be used from within a store.
 * It needs a LocalizationProvider so it can localize attributes but otherwise can
 * be used outside of a React component context (e.g. in a store).
 */
export class StoreModelValidator<T> implements ModelValidator<T> {
    /**Holds the last validation results.*/
    @observable
    public validation: Validation<T>;
    /**Holds the model to be validated.*/
    @observable
    public model: T = null;
    /**Disposer for observer on the above model.*/
    private disposer: IReactionDisposer;
    /**Holds all field names that have been validated. Only fields that have been validated may show errors.*/
    @observable
    private validatedFields = new Map<string, boolean>();
    /**true, if our model has been modified.*/
    @observable
    private dirty: boolean;

    /**
     * Create a new StoreModelValidator.
     * @param config the validation config holding rules, models and other config.
     */
    constructor(private config: ValidationConfig<T>) {
        if (!this.config.localizationProvider) {
            this.config.localizationProvider = new NoopLocalizationProvider();
        }
        if (config.model) {
            this.setModel(config.model);
        } else {
            const validation = this.createValidation();
            validation.check();      //perform initial check on nothing
            this.validation = validation;
        }
    }

    /**
     * Sets the model to be verified.
     * Will immediately do a verification run.
     * @param {T} model the data we want to verify.
     */
    @action
    public setModel(model: T) {
        if (this.model !== model) {
            this.model = model;
            if (this.disposer) {
                this.disposer();
                this.disposer = null;
            }
            if (this.model && !this.config.manual) {
                this.disposer = observe(this.model, change => this.modelChanged(change)) as IReactionDisposer;
            }
            //new model, so clear dirty fields
            this.reset();
        }
    }

    public setRules(rules: any) {
        this.config.rules = rules;
        this.reset();
    }

    /**
     * Reset the validation for this model.
     * This means that no fields are dirty anymore and thus no validation errors will be displayed.
     */
    @action
    public reset() {
        const validation = this.createValidation();
        validation.check();
        this.validation = validation;
        this.validatedFields.clear();
        this.dirty = false;
    }

    public getModel(): T {
        return this.model;
    }

    @computed
    public get errors(): Errors {
        return this.validation.errors;
    }

    @computed
    public get errorCount(): number {
        return this.validation.errorCount;
    }

    /**
     * One of the properties on the given model has changed.
     * Validate the corresponding field.
     * @param {IObjectDidChange} change describes the change.
     */
    private modelChanged(change: IObjectDidChange) {
        if (change.type === 'update' || change.type === 'add') {
            if (change.name) {
                this.validateField(change.name);      //field was changed, validate it
            } else {
                this.validateForm();
            }
        }
    }

    /**
     * Validate a single field only.
     * The model must have been set using {@link WithValidator.setModel() setModel()}.
     * @param {string} field the name of the property to validate on the model.
     * @returns {boolean} true, if the field is valid.
     */
    public validateField = (field: string): boolean => {
        const validation = this.createValidation();
        validation.check();
        return this.fieldValidated(field, validation);
    }

    /**Validation on field level has finished.
     *
     * @param {string} field the field we validated.
     * @param {Validation<T>} validation the validation results.
     * @returns {boolean} true, if the field is valid; false, otherwise.
     */
    @action
    private fieldValidated(field: string, validation: Validation<T>) {
        const hasErrors = validation.errors.has(field);
        //mark field as dirty so errors show up
        this.markDirty(field);
        this.validation = validation;     //store new validation
        return !hasErrors;
    }

    /**Mark given field as dirty.*/
    private markDirty(field: string) {
        //mark field as dirty so errors show up
        if (!this.validatedFields.has(field)) {
            this.validatedFields.set(field, true);
//            this.validatedFields[field] = true;
            this.dirty = true;
        }
    }

    /**
     * Validate the complete form.
     * The model must have been set using {@link WithValidator.setModel() setModel()}.
     * @returns {boolean} true, if the model is valid.
     */
    public validateForm = (): boolean => {
        const validation = this.createValidation();
        validation.check();
        return this.formValidated(validation);
    }

    /**Validation of the whole model completed.
     *
     * @param {Validation<T>} validation the validation results.
     * @returns {boolean} true, if the model is valid; false, otherwise.
     */
    @action
    private formValidated(validation: Validation<T>) {
        //mark all erroneous fields as dirty so their errors show up
        for (let field of Object.keys(validation.errors.errors)) {
            this.markDirty(field);
        }
        this.validation = validation;
        return this.errorCount === 0;
    }

    /**Did the last validation yield a positive result for the model?*/
    @computed
    public get isValid() {
        return this.errorCount === 0;
    }

    private createValidation(): Validation<T> {
        if (this.config.localizationProvider) {
            const lang = this.config.localizationProvider.language();
            if (lang && lang.length >= 2) {
                ValidatorJS.useLang(lang.substring(0, 2));
            }
        }
        const customMessages = this.translateMessageKeys(this.config.customErrors);
        let validator;
        if (isObservableMap(this.model)) {          //validatorjs cannot work with maps
            const obj = {};         //convert back to object
            this.model.forEach((v, k) => {
                obj[k] = v;
            });
            validator = new ValidatorJS(obj, this.config.rules, customMessages);
        } else {
            validator = new ValidatorJS(this.model, this.config.rules, customMessages);
        }
        if (this.config.attributeNames) {
            validator.setAttributeNames(this.translateMessageKeys(this.config.attributeNames));
        }
        return validator;
    }

    /**
     * Translate the given messages using the localizationProvider.
     * @param messages the message keys to translate.
     */
    private translateMessageKeys(messages: { [key: string]: string }) {
        if (messages && this.config.localizationProvider) {
            const translations = {};
            for (let key of Object.keys(messages)) {
                translations[key] = this.config.localizationProvider.translate(key);
            }
            return translations;
        }
        return messages;
    }

    /**
     * Determines whether we shall show errors on the given field right now.
     * This doesn't mean that the field actually has errors, it only gives a statement
     * on whether we should show them, if it has any.
     * @param {string} field the name of the field property.
     * @returns {boolean} true, if we shall show errors on that field; false, otherwise.
     */
    public showErrorsOnField(field: string): boolean {
        return this.validatedFields.has(field);     //only show if (explicitly) validated
    }

    @computed
    public get fieldsThatMayShowErrors() {
        return this.validatedFields;
    }

    /**Returns true, if no changes were made yet to the model.*/
    @computed
    public get pristine() {
        return !this.dirty;
    }
}
