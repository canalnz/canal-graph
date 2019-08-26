import {Column, Entity, PrimaryColumn} from 'typeorm';

export type BotPermissionQualifierType = 'USER' | 'ROLE' | 'CHANNEL' | 'GUILD';
export const botPermissionQualifierTypes = ['USER', 'ROLE', 'CHANNEL', 'GUILD'];

@Entity('bot_permissions')
export class BotPermission {
  @PrimaryColumn('bigint')
  public id!: string;

  @Column({
    name: 'bot_id',
    type: 'bigint'
  })
  public botId!: string;

  @Column()
  public name!: string;
}

// They're tiny! I'm sure it's fine...
// tslint:disable-next-line:max-classes-per-file
@Entity('bot_permission_qualifiers')
export class BotPermissionQualifier {
  @PrimaryColumn('bigint')
  public id!: string;

  @Column({
    name: 'perm_id',
    type: 'bigint'
  })
  public permId!: string;

  @Column({
    type: 'enum',
    enum: botPermissionQualifierTypes
  })
  public type!: BotPermissionQualifierType;

  @Column()
  public value!: string;
}
