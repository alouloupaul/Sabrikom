import { Routes } from '@angular/router';
import { authGuard, adminGuard, sellerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent)
  },
  {
    path: 'listings/:id',
    loadComponent: () => import('./features/listing-detail/listing-detail.component').then(m => m.ListingDetailComponent)
  },
  {
    path: 'listings/new',
    loadComponent: () => import('./features/listing-form/listing-form.component').then(m => m.ListingFormComponent),
    canActivate: [sellerGuard]
  },
  {
    path: 'listings/:id/edit',
    loadComponent: () => import('./features/listing-form/listing-form.component').then(m => m.ListingFormComponent),
    canActivate: [sellerGuard]
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/seller-dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'favorites',
    loadComponent: () => import('./features/buyer-dashboard/buyer-dashboard.component').then(m => m.BuyerDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'messages',
    loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'messages/:listingId/:otherUserId',
    loadComponent: () => import('./features/messages/conversation.component').then(m => m.ConversationComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: '' }
];
