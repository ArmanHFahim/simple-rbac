import { Column, Entity, Unique, ManyToMany, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

import { Role } from './role.entity';

@Entity('permissions')
@Unique(['resource', 'action'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  resource: string;

  @Column({ length: 50 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Computed property for permission string
  get permissionString(): string {
    return `${this.resource}:${this.action}`;
  }
}
