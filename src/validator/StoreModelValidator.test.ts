import {StoreModelValidator} from './StoreModelValidator';
import {observable} from 'mobx';

interface ExampleData {
    name: string;
    age: number;
    email: string;
    birthday: Date;
}

class ExampleStore {
    @observable
    public data: ExampleData = {
        name: '',
        age: null,
        email: '',
        birthday: null
    };
    public readonly validator =  new StoreModelValidator({
        rules: {
            name: 'required',
            age: 'numeric|max:99',
            email: 'email',
            birthday: 'date|required_without:age'
        },
        model: this.data
    });
}

const mockExampleData: ExampleData = {
    name: 'Tim P. Mandi',
    age: 12,
    email: 'timbergoggmandi@duglansmandi.du',
    birthday: new Date(2006, 6, 17)
};

describe('StoreModelValidator', () => {

    let store: ExampleStore;

    beforeEach(() => {
        store = new ExampleStore();
    });

    it('has errors with no model set', () => {
        expect(store.validator.isValid).toBeFalsy();
        expect(store.validator.errorCount).toBe(2);
        expect(store.validator.errors.get('name')).toContain('The name field is required.');
        expect(store.validator.errors.get('birthday')).toContain('The birthday field is required when age is empty.');
    });

    describe('all values filled in correctly', () => {
        beforeEach(() => {
            store.validator.setModel(mockExampleData);
        });

        it('validation passes', () => {
            expect(store.validator.isValid).toBeTruthy();
        });

        it('empty name fails', async () => {
            expect(store.validator.isValid).toBeTruthy();
            store.validator.model.name = '';
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(store.validator.isValid).toBeFalsy();
        });

        it('birthday not required with age', async () => {
            expect(store.validator.isValid).toBeTruthy();
            store.validator.model.birthday = null;
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(store.validator.isValid).toBeTruthy();
        });

        it('birthday required without age', async () => {
            expect(store.validator.isValid).toBeTruthy();
            store.validator.model.birthday = null;
            store.validator.model.age = null;
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(store.validator.isValid).toBeFalsy();
            expect(store.validator.errors.get('birthday')).toContain('The birthday field is required when age is empty.');
        });
    });
});
