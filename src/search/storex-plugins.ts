import { AnnotationsListPlugin } from 'src/search/background/annots-list'
import { PageUrlMapperPlugin } from 'src/search/background/page-url-mapper'
import { SuggestPlugin } from 'src/search/search/suggest'
import { GetPksPlugin } from 'src/search/plugins/get-pks'

export const plugins = [
    new AnnotationsListPlugin(),
    new PageUrlMapperPlugin(),
    new SuggestPlugin(),
    new GetPksPlugin(),
]
