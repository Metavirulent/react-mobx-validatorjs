import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {ModelValidator, validator} from './ModelValidator';
import {inject, observer} from 'mobx-react';
import {ValidationWrapper} from './ValidationWrapper';

interface ExampleData {
    name: string;
    age: string;
    email: string;
}

interface AppStores {
}

interface ExampleFormProps {
}

interface InjectedProps {
    validator?: ModelValidator<ExampleData>;
}

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


let component: ReactWrapper<any, any>;

describe('<WithValidator/>', () => {

    beforeEach(() => {
        component = mount(<ExampleForm/>);
    });

    it('should disable submit if name is empty', function () {
        const renderer = component.render();
        const submitButton = renderer.find('button#submit');
        expect(submitButton.prop('disabled')).toBeTruthy();
    });

    it('should enable submit if name is valid', function () {
        const nameInput = component.find('input#name');
        (nameInput.getDOMNode() as HTMLInputElement).value = 'Godzilla';
        nameInput.simulate('change');
        const renderer = component.render();
        const submitButton = renderer.find('button#submit');
        expect(submitButton.prop('disabled')).toBeFalsy();
    });

    it('should show error if name is too long', function () {
        const nameInput = component.find('input#name');
        (nameInput.getDOMNode() as HTMLInputElement).value =
            '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
        nameInput.simulate('change');
        const renderer = component.render();
        const errors = renderer.find('div[class="invalid-msg"]');
        expect(errors.text()).toEqual('The name field must be between 3 and 32.');
        const submitButton = renderer.find('button#submit');
        expect(submitButton.prop('disabled')).toBeTruthy();
    });

    it('should show an error if email is not an email', function () {
        const nameInput = component.find('input#name');
        (nameInput.getDOMNode() as HTMLInputElement).value = 'Godzilla';
        nameInput.simulate('change');
        const emailInput = component.find('input#email');
        (emailInput.getDOMNode() as HTMLInputElement).value = 'god@zilla';
        emailInput.simulate('change');
        const renderer = component.render();
        const errors = renderer.find('div[class="invalid-msg"]');
        expect(errors.text()).toEqual('The email format is invalid.');
        const submitButton = renderer.find('button#submit');
        expect(submitButton.prop('disabled')).toBeTruthy();
    });

    it('should enable submit if email is in correct format', function () {
        const nameInput = component.find('input#name');
        (nameInput.getDOMNode() as HTMLInputElement).value = 'Godzilla';
        nameInput.simulate('change');
        const emailInput = component.find('input#email');
        (emailInput.getDOMNode() as HTMLInputElement).value = 'god@zilla.com';
        emailInput.simulate('change');
        const renderer = component.render();
        const errors = renderer.find('div[class="invalid-msg"]');
        expect(errors.length).toBe(0);
        const submitButton = renderer.find('button#submit');
        expect(submitButton.prop('disabled')).toBeFalsy();
    });

    it('should show an error if age is not a number', function () {
        const nameInput = component.find('input#name');
        (nameInput.getDOMNode() as HTMLInputElement).value = 'Godzilla';
        nameInput.simulate('change');
        const ageInput = component.find('input#age');
        (ageInput.getDOMNode() as HTMLInputElement).value = 'hundred';
        ageInput.simulate('change');
        const renderer = component.render();
        const errors = renderer.find('div[class="invalid-msg"]');
        expect(errors.text()).toEqual('The age must be an integer.The age field must be between 0 and 100.');
        const submitButton = renderer.find('button#submit');
        expect(submitButton.prop('disabled')).toBeTruthy();
    });

    it('should show an error if age is out of range', function () {
        const nameInput = component.find('input#name');
        (nameInput.getDOMNode() as HTMLInputElement).value = 'Godzilla';
        nameInput.simulate('change');
        const ageInput = component.find('input#age');
        (ageInput.getDOMNode() as HTMLInputElement).value = '101';
        ageInput.simulate('change');
        const renderer = component.render();
        const errors = renderer.find('div[class="invalid-msg"]');
        expect(errors.text()).toEqual('The age field must be between 0 and 100.');
        const submitButton = renderer.find('button#submit');
        expect(submitButton.prop('disabled')).toBeTruthy();
    });

    it('should enable submit if age is within range', function () {
        const nameInput = component.find('input#name');
        (nameInput.getDOMNode() as HTMLInputElement).value = 'Godzilla';
        nameInput.simulate('change');
        const ageInput = component.find('input#age');
        (ageInput.getDOMNode() as HTMLInputElement).value = '64';
        ageInput.simulate('change');
        const renderer = component.render();
        const errors = renderer.find('div[class="invalid-msg"]');
        expect(errors.length).toBe(0);
        const submitButton = renderer.find('button#submit');
        expect(submitButton.prop('disabled')).toBeFalsy();
    });

});
