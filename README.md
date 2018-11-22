# Validation Library for React, MobX and validatorjs
Simple model-based (form) validation for React projects using MobX for state management. Validation rules are based on [validatorjs](https://github.com/skaterdav85/validatorjs]).

After having used different MobX-based validation libraries, we ended up running our own because most existing libraries
try to validate on the view which leads to unnecessary complexity, puts some limitations on how you write your UI and
ultimately is the wrong place. After all, validation is about checking your data, not its visualization.

This library uses MobX to observe the model and enforce validatorjs rules with the following advantages:
- you can modify the model however you like and the validation will always be correct.
- you are totally free on how you write your form, as the validation library doesn't really care about visualization.
Use whatever UI library you prefer.
- your UI will still automatically update when there's a validation change if you use `@observer` on your UI component.

## How to install
`npm --save react-mobx-validatorjs`

This library is written in Typescript and thus comes with full Typescript support ootb.
In addition, all samples are using Typescript (IMHO, you shouldn't use Javascript anyway).

### Dependencies

- React (duh!)
- MobX
- validatorjs

You must install these dependencies on your own.

# Usage
Validation can either be done in a (MobX) Store or directly on the React component holding the form.

We think that doing validation in the store is usually the better solution, as the model is validated rather than the view
but the choice is up to you.

## Example

For our examples, let's assume, we have an example model holding our data to be verified.
```typescript
interface ExampleData {
    name: string;
    age: number;
    email: string;
}
```

Also, let's assume that we have a general interface `AppStores` that contains all stores we have provided via MobX.

```typescript
/**
* Holds all stores in the application.
*/
interface AppStores {
    exampleStore: ExampleStore;
}

const stores = {
    exampleStore: new ExampleStore()
};

<Provider {...stores}>
    ...
</Provider>

````

## Validation directly in the Form

If you want to validate directly in the form, then there's no need to have a store, you probably hold your data in the React component.

```typescript
/**
* Holds our component's props.
*/
interface ExampleFormProps {
}
/**
* Holds the properties we get injected by MobX.
*/
interface InjectedProps {
    validator: ModelValidator<ExampleData>;
}
```

Now we create the component holding the form and getting a validator injected.
You can either use a decorator `@validator` to create the validator or use `withValidator` to explicitly create a HOC.

As a consequence, you'll get a `validator` injected by MobX that you can use in the component.

```typescript
@validator<ExampleData, InjectedProps>({
    rules: {
        name: 'required|string|between:3,32',
        age: 'integer|between:0,100',
        email: 'email|max:100'
    },
    model: {
        name: '',
        age: '',
        email: ''
    }
})
@inject<AppStores & InjectedProps, ExampleFormProps, InjectedProps, {}>(allStores => ({
    validator: allStores.validator as ModelValidator<ExampleData>
}))
@observer
class ExampleForm extends React.Component<ExampleFormProps> {
    private get injected(): InjectedProps {
        return this.props as any as InjectedProps;
    }

    public render() {
        const validator = this.injected.validator;
        const model = validator.getModel();
        return (
            <form>
                <ValidationWrapper validator={validator} field='name'>
                    <input
                        id='name'
                        value={model.name || ''}
                        onChange={evt => model.name = evt.target.value}
                    />
                </ValidationWrapper>
                <ValidationWrapper validator={validator} field='age'>
                    <input
                        id='age'
                        value={model.age || ''}
                        onChange={evt => model.age = evt.target.value}
                    />
                </ValidationWrapper>
                <ValidationWrapper validator={validator} field='email'>
                    <input
                        id='email'
                        value={model.email || ''}
                        onChange={evt => model.email = evt.target.value}
                    />
                </ValidationWrapper>
                <button id='submit' type='button' disabled={!validator.isValid}>Submit</button>
            </form>
        );
    }
}
```

Now, whenever you edit one of the properties in the model, a new validation is triggered and will update you form.
Moreover, since validation is done on the model rather than the UI, you can even modify the model behind the scenes
and get your validation updated.

###ValidationWrapper

This is a helper component that visualizes errors. You can roll your own if you prefer.

All it does is:
- wrap its children and show a CSS class `invalid-field` if there are errors. This can be used to show red borders around an input field.
- render all errors using the provided renderer (or the default one). If you stick with the default one, then each error will have the CSS class `invalid-msg`.

| Property | Description |
| --- | --- |
| validator | Provide the ModelValidator. |
| field | Set to the name of the property in your model (e.g. age). |
| errorClassName? | Optional CSS name to apply for the `<div>` around your children in case there are errors (to show a red border, for example). Defaults to `invalid-field`.|
| errorsRenderer? | Optional renderer for individual error messages. |

You don't have to use ValidationWrapper but it gives you an idea on how to use the validator.

## Validation in the Store

For non-trivial forms, we do think that it is better to hold the data and corresponding validator in a store and inject this
store to the React component.
 
In your MobX store, you hold both, the data and the corresponding StoreModelValidator.

```typescript
import {observable} from 'mobx';

export class ExampleStore {
    @observable
    public data: ExampleData = {
        name: '',
        age: null,
        email: ''
    };
    public readonly validator =  new StoreModelValidator({
        rules: {
            name: 'required',
            age: 'numeric|max:99',
            email: 'email'
        },
        model: this.data
    });
}
```

Your form will pretty much look the same as in the example above where there's no store, except that you don't have to
use the `@validator` and get the ExampleStore injected instead (and use its validator property).

# Configuration
When creating a StoreModelValidator or getting one injected to a React component via `@validator` or `withValidator`, you must
provide a configuration defining the rules to enforce.

```typescript
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
```

# ModelValidator API

Here's the API of the ModelValidator.
```typescript
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
```

# Which Fields May Show Errors?

Usually, you don't want to visualize errors right away before the user even had a chance to do something wrong.
Thus, we check internally which field has been touched by the user and only show errors on fields that are dirty.

Use `showErrorsOnField` to check if a field shall show errors or `fieldsThatMayShowErrors` to get a full map.
Every time a user modifies a field, it will be added.

If you validate the full form via `validateForm()` (e.g. when the user tries to submit it),
then all fields holding errors will also be added since you really want errors to show up regardless of whether
the user touched a field or not.

The `ValidationWrapper` takes these fields into account, if you run your own, make sure to honor these

Please note that `showErrorsOnField` returning true only means that errors on the given field should be
shown *if there are any*, it doesn't mean that there actually are errors.

Use `errors` to get access to the the validatorjs `Errors` object holding all errors of all fields.

# Localization
validatorjs comes with built-in localization but attributes and custom error messages typically need to be localized, too.
There are different i18n providers out there, and this library doesn't depend on any of them.
You must write your own implementation of the interface LocalizationProvider for your i18n library of choice
and use that one.

If you don't provide one, then we'll try to determine the language from the environment and simply not translate attributes.

```typescript
/**
 * A LocalizationProvider is an adapter for a certain localization library.
 * Localization is used to localize attribute names.
 */
export interface LocalizationProvider {
    /**
     * Translate the given key using the current language.
     * @param key the key to translate.
     * @return the translated message.
     */
    translate(key: string): string;

    /**
     * Return the current language to use.
     */
    language(): string;
}
```