import { Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { PermissionGuard } from './permission.guard';

@Module({
  providers: [AuthorizationService, PermissionGuard],
  exports: [AuthorizationService, PermissionGuard],
})
export class PermissionsModule {}
