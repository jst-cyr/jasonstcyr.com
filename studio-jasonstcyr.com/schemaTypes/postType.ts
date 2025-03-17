import {defineField, defineType} from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'string'}],
      title: 'Tags',
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [{type: 'string'}],
      title: 'Categories',
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'wordpressId',
      type: 'string',
      title: 'WordPress ID',
    }),
  ],
})