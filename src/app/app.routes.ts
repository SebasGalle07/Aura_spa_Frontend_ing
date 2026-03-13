import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { VerifyEmailComponent } from './features/auth/verify-email.component';
import { PrivacyPolicyComponent } from './features/legal/privacy-policy.component';
import { BookingComponent } from './features/booking/booking.component';
import { HistoryComponent } from './features/history/history.component';
import { ProfileComponent } from './features/profile/profile.component';
import { AdminComponent } from './features/admin/admin.component';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'services', redirectTo: 'book', pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'politica-datos', component: PrivacyPolicyComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'book', component: BookingComponent, canActivate: [authGuard] },
  { path: 'appointments', component: HistoryComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];
