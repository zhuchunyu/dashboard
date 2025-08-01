import i18n from '@/locales'
import NotFoundPage from '@/views/exception/404'
import NoPermission from '@/views/exception/403'
import EmailVerify from '@/views/email-verify'
import NoProject from '@/views/no-project'
import Clouduser from '@/views/clouduser'
import Icons from '@/components/Icon/Icons'

export const menusConfig = getModulesRouteConfig()

const routes = [
  ...getScopeRoutes(),
  ...generateRoutesFromMenu(menusConfig),
  {
    name: 'Clouduser',
    path: '/clouduser',
    component: Clouduser,
    meta: {
      label: i18n.t('scope.cloudid'),
    },
  },
  {
    path: '/email-verification/id/:id/token/:token',
    name: 'EmailVerification',
    meta: {
      layout: 'full-screen',
      auth: false,
    },
    component: EmailVerify,
  },
  { name: 'NoProject', path: '/no-project', component: NoProject, meta: { layout: 'full-screen' } },
  { name: '404', path: '/404', component: NotFoundPage, meta: { layout: 'full-screen', auth: false } },
  { name: '403', path: '/403', component: NoPermission, meta: { layout: 'full-screen', auth: false } },
  { name: 'NotFound', path: '*', component: NotFoundPage, meta: { layout: 'full-screen', auth: false } },
]

if (process.env.VUE_APP_ENABLE_ICON) {
  routes.push({ name: 'Icons', path: '/icons', component: Icons, meta: { layout: 'full-screen', auth: false } })
}

function getScopeRoutes () {
  const r = require.context('../../scope', true, /.\/router\/routes.js/)
  const keys = r.keys()
  let ret = []
  if (keys && keys.length) {
    ret = r(keys[0]).default
  }
  return ret
}

function getModulesRouteConfig () {
  const isPrivate = process.env.VUE_APP_IS_PRIVATE
  const moduleRoute = process.env.VUE_APP_MODULE_ROUTE
  let ret = []
  const r = (isPrivate || moduleRoute) ? require.context('../../scope', true, /.\/router\/index.js/) : require.context('../../containers', true, /^((?![\\/]node_modules).)*.\/router\/index.js$/)
  r.keys().forEach(dir => {
    ret = ret.concat(r(dir).default)
  })
  ret.sort((a, b) => a.index - b.index)
  ret = ret.filter(val => !val.meta.undetected)
  for (let i = 0, len = ret.length; i < len; i++) {
    const item = ret[i]
    item.meta.group = i
    if (item.menus) {
      for (let j = 0; j < item.menus.length; j++) {
        const menu = item.menus[j]
        if (menu.submenus) {
          for (let m = 0; m < menu.submenus.length; m++) {
            const subitem = menu.submenus[m]
            subitem.meta.group = i
          }
        } else {
          menu.meta.group = i
        }
      }
    } else {
      item.menu.meta.group = i
    }
  }
  return ret
}

// Menu should have 2 levels.
function generateRoutesFromMenu (menugroups = [], routes = []) {
  for (let m = 0, ml = menugroups.length; m < ml; m++) {
    const mg = menugroups[m]
    if (mg.menu) {
      routes.push(mg.menu)
    }
    if (mg.menus) {
      for (let i = 0, l = mg.menus.length; i < l; i++) {
        const item = mg.menus[i]
        if (item.path) {
          routes.push(item)
        }
        if (item.submenus) {
          // second tier
          for (let j = 0; j < item.submenus.length; j++) {
            const subitem = item.submenus[j]
            if (subitem.path) {
              routes.push(subitem)
            }
          }
        }
      }
    }
  }
  return routes
}

routes.forEach((item, index) => {
  if (item.children) {
    item.children.forEach((menu) => {
      if (item.meta?.label) {
        if (!menu.meta) {
          menu.meta = { label: item.meta.label }
        }
        if (!menu.meta.label) {
          menu.meta.label = item.meta.label
        }
      }
    })
  }
})

export default routes
