import {pathsAreEqual, stringToPath} from 'sanity'
import {defineMigration, set} from 'sanity/migrate'

const targetPath = stringToPath('some.path')

export default defineMigration({
  title: 'Import WP',
  documentTypes: ["post"],

  migrate: {
    string(node, path, ctx) {
      if (pathsAreEqual(path, targetPath)) {
        return set([
          {
            style: 'normal',
            _type: 'block',
            children: [
              {
                _type: 'span',
                marks: [],
                text: node,
              },
            ],
            markDefs: [],
          },
        ])
      }
    },
  },
})
