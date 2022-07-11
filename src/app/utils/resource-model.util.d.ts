import { IToModelOptions } from '../interfaces/to-model-options.interface';
/**
 * Creates an instance of a ResourceModel from a resourceObject
 * @param    ResourceModelClass The class to construct from the resourceObject
 * @param    resourceObject     The resource object from which to construct the instance of ResourceModelClass
 * @returns                     The instance of ResourceModelClass transformed from resourceObject
 */
export declare function fromResource(ResourceModelClass: new () => any, resourceObject: any): any;
/**
 * Creates a model object (object prepared for serialization) from an instance of a ResourceModel class
 * @param    resourceModelObject The object that needs to be transformed to model
 * @param    options             Options for transformations
 * @returns                      An object of the transformed mdoel
 */
export declare function toModel(resourceModelObject: any, options?: IToModelOptions): any;
/**
 * Get the field name from the ResourceModelClass that is mapped from the specified resource field
 * @example
 * class ExampleResourceModel {
 *  @ResourceValue('tenantId') public sender: string;
 * }
 * getMappedResourceField(ExampleResourceModel, 'tenantId'); // returns 'sender'
 */
export declare function getMappedResourceField(ResourceModelClass: new () => any, originalField: string): any;
/**
 * Get the original field name from the resource that is mapped to a specified ResourceModelClass field
 * @example
 * class ExampleResourceModel {
 *  @ResourceValue('tenantId') public sender: string;
 * }
 * getOriginalResourceField(ExampleResourceModel, 'sender'); // returns 'tenantId'
 */
export declare function getOriginalResourceField(ResourceModelClass: new () => any, classField: string): any;
/**
 * Get the field from the model that is mapped from a specified ResourceModelClass field
 * @example
 * class ExampleResourceModel {
 *  @ModelValue('tenantId') public sender: string;
 * }
 * getMappedModelField(ExampleResourceModel, 'sender'); // returns 'tenantId'
 */
export declare function getMappedModelField(ResourceModelClass: new () => any, classField: string): any;
/**
 * Get the ResourceModelClass field that is mapped to the specified model field
 * @example
 * class ExampleResourceModel {
 *  @ModelValue('tenantId') public sender: string;
 * }
 * getMappedModelField(ExampleResourceModel, 'tenantId'); // returns 'sender'
 */
export declare function getOriginalModelField(ResourceModelClass: new () => any, mappedField: string): any;
