export interface GoodsCategoryQueryParams {
  name?: string
  status?: string
}

export interface GoodsCategoryEntity extends BaseEntity {
  id: string
  parentId: string
  name: string
  image: string
  sort: number
  status: string
  description: string
}

export interface GoodsCategoryTreeEntity extends GoodsCategoryEntity {
  children: GoodsCategoryTreeEntity[]
}