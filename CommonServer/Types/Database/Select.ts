import BaseModel from 'Common/Models/BaseModel';
import DatabaseProperty from 'Common/Types/Database/DatabaseProperty';
import { JSONObject } from 'Common/Types/JSON';
import { FindOptionsSelectProperty } from 'typeorm';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';

export type SelectPropertyOptions<Property> = Property extends DatabaseProperty
    ? boolean
    : Property extends JSONObject
    ? boolean
    : FindOptionsSelectProperty<Property> | FindOptionsRelations<Property> | boolean;

/**
 * Select find options.
 */

export declare type SelectOptions<Entity> = {
    [P in keyof Entity]?: SelectPropertyOptions<NonNullable<Entity[P]>>;
};

type Select<TBaseModel extends BaseModel> = SelectOptions<TBaseModel>;
export default Select;
