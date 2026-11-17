import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'account/show': ExtractProps<(typeof import('../../inertia/pages/account/show.tsx'))['default']>
    'admin/dashboard': ExtractProps<(typeof import('../../inertia/pages/admin/dashboard.tsx'))['default']>
    'admin/image_edit': ExtractProps<(typeof import('../../inertia/pages/admin/image_edit.tsx'))['default']>
    'admin/images': ExtractProps<(typeof import('../../inertia/pages/admin/images.tsx'))['default']>
    'admin/updates': ExtractProps<(typeof import('../../inertia/pages/admin/updates.tsx'))['default']>
    'admin/users': ExtractProps<(typeof import('../../inertia/pages/admin/users.tsx'))['default']>
    'auth/check_email': ExtractProps<(typeof import('../../inertia/pages/auth/check_email.tsx'))['default']>
    'auth/forgot_password': ExtractProps<(typeof import('../../inertia/pages/auth/forgot_password.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/reset_password': ExtractProps<(typeof import('../../inertia/pages/auth/reset_password.tsx'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.tsx'))['default']>
    'collection/list': ExtractProps<(typeof import('../../inertia/pages/collection/list.tsx'))['default']>
    'dashboard': ExtractProps<(typeof import('../../inertia/pages/dashboard.tsx'))['default']>
    'errors/forbidden': ExtractProps<(typeof import('../../inertia/pages/errors/forbidden.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'minifigs/index': ExtractProps<(typeof import('../../inertia/pages/minifigs/index.tsx'))['default']>
    'minifigs/show': ExtractProps<(typeof import('../../inertia/pages/minifigs/show.tsx'))['default']>
    'pages/about': ExtractProps<(typeof import('../../inertia/pages/pages/about.tsx'))['default']>
    'pages/legal': ExtractProps<(typeof import('../../inertia/pages/pages/legal.tsx'))['default']>
    'pages/privacy': ExtractProps<(typeof import('../../inertia/pages/pages/privacy.tsx'))['default']>
    'pages/site_map': ExtractProps<(typeof import('../../inertia/pages/pages/site_map.tsx'))['default']>
    'pages/terms': ExtractProps<(typeof import('../../inertia/pages/pages/terms.tsx'))['default']>
    'search': ExtractProps<(typeof import('../../inertia/pages/search.tsx'))['default']>
    'sets/index': ExtractProps<(typeof import('../../inertia/pages/sets/index.tsx'))['default']>
    'sets/show': ExtractProps<(typeof import('../../inertia/pages/sets/show.tsx'))['default']>
    'themes/index': ExtractProps<(typeof import('../../inertia/pages/themes/index.tsx'))['default']>
    'themes/show': ExtractProps<(typeof import('../../inertia/pages/themes/show.tsx'))['default']>
  }
}
