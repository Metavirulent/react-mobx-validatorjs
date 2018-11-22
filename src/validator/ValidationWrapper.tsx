import * as React from 'react';
import {ModelValidator} from './ModelValidator';
import {observer} from 'mobx-react';
import {ReactNode} from 'react';

export interface ValidationWrapperProps<T> {
    /**Validator used for our model T.*/
    validator: ModelValidator<T>;
    /**Name of the field in T we are wrapping.*/
    field: string;
    /**Optional error CSS class for div around children. Defaults to 'invalid-field'.*/
    errorClassName?: string;
    /**Optional renderer to render the errors for our field.*/
    errorsRenderer?: (errors: string[]) => ReactNode;
}

/**
 * Stateless component rendering the validation errors for a given field.
 * <T> type holding the field.
 */
@observer
class ValidationWrapper<T> extends React.Component<ValidationWrapperProps<T>> {
    public render() {
        const validation = this.props.validator.validation;
        //check if we shall show errors on this field
        //this depends on whether the field has been validated (either due to changes or due to form submit)
        //we don't want to show errors on pristine fields the user didn't even have the chance to correct
        const showErrors = this.props.validator.showErrorsOnField(this.props.field) && validation.errors.has(this.props.field);
        return (
            <div>
                <div className={showErrors ? this.props.errorClassName || 'invalid-field' : null}>
                    {this.props.children}
                </div>
                {showErrors && this.renderErrors(validation.errors.get(this.props.field))}
            </div>
        );
    }

    private renderErrors(errors: string[]) {
        if (!errors) {
            return null;
        }
        if (this.props.errorsRenderer) {        //have errorsRenderer render them for us
            return this.props.errorsRenderer(errors);
        }
        return errors.map(error =>
            <div className='invalid-msg' key={error}>
                {error}
            </div>
        );
    }
}

export {ValidationWrapper};
