import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {codeInput} from '@sanity/code-input'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'jasonstcyr.com',

  projectId: 'sswab2yy',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), media(), codeInput()],

  schema: {
    types: schemaTypes,
  },
})
