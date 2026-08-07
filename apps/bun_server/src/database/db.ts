import { Repository } from 'typeorm'
import { type DatabaseEntity, getDataSource } from './data-source'
export async function getRepository<Entity extends DatabaseEntity>(
  entity: Entity,
): Promise<Repository<InstanceType<Entity>>> {
  const dataSource = await getDataSource()
  return dataSource.getRepository<InstanceType<Entity>>(entity)
}
