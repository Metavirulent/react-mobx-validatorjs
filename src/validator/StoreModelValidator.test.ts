import {StoreModelValidator} from './StoreModelValidator';
import {NoopLocalizationProvider} from './NoopLocalizationProvider';
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
        name: 'Tim P. Mandi',
        age: 12,
        email: 'timbergoggmandi@duglansmandi.du',
        birthday: new Date(2006, 6, 17)
    };
    public readonly validator =  new StoreModelValidator({
        rules: {
            name: 'required',
            age: 'numeric|max:99',
            email: 'email',
            birthday: 'date|required_without:age'
        },
        model: this.data
    }, new NoopLocalizationProvider());
}

const mockExampleData: ExampleData = {
    name: 'Tim P. Mandi',
    age: 12,
    email: 'timbergoggmandi@duglansmandi.du',
    birthday: new Date(2006, 6, 17)
};

describe('StoreModelValidator', () => {

    let store: StoreModelValidator<ExampleData>;

    beforeEach(() => {
        store = new StoreModelValidator({
            rules: {
                name: 'required',
                age: 'numeric|max:99',
                email: 'email',
                birthday: 'date|required_without:age'
            }
        }, new NoopLocalizationProvider());
    });

    it('has errors with no model set', () => {
        expect(store.isValid).toBeFalsy();
        expect(store.errorCount).toBe(2);
        expect(store.errors.get('name')).toContain('The name field is required.');
        expect(store.errors.get('birthday')).toContain('The birthday field is required when age is empty.');
    });

    describe('all values filled in correctly', () => {
        beforeEach(() => {
            store.setModel(mockExampleData);
        });

        it('validation passes', () => {
            expect(store.isValid).toBeTruthy();
        });

        it('empty name fails', async () => {
            expect(store.isValid).toBeTruthy();
            store.model.name = '';
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(store.isValid).toBeFalsy();
        });

        it('birthday not required with age', async () => {
            expect(store.isValid).toBeTruthy();
            store.model.birthday = null;
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(store.isValid).toBeTruthy();
        });

        it('birthday required without age', async () => {
            expect(store.isValid).toBeTruthy();
            store.model.birthday = null;
            store.model.age = null;
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(store.isValid).toBeFalsy();
            expect(store.errors.get('birthday')).toContain('The birthday field is required when age is empty.');
        });
    });
});
