import {Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn} from 'typeorm';
import Bot from './Bot';
import {Script} from './Script';
import UserAuthMethod from './UserAuthMethod';
import UserSession from './UserSession';

@Entity('users')
export default class User {
  @PrimaryColumn('bigint')
  public id!: string;

  @Column()
  public name!: string;

  @Column()
  public email!: string;

  @Column()
  public verified!: boolean;

  @Column({
    name: 'avatar_hash',
    type: 'varchar',
    nullable: true
  })
  public avatarHash!: string | null;

  @CreateDateColumn()
  public created!: Date;

  @Column({
    name: 'last_login',
    type: 'timestamp',
    nullable: true
  })
  public lastLogin!: Date | null;

  @OneToMany((type) => Bot, (bot) => bot.resourceOwner, {lazy: true})
  public bots!: Promise<Bot[]>;

  @OneToMany((type) => Script, (script) => script.resourceOwner, {lazy: true})
  public scripts!: Promise<Script[]>;

  @OneToMany((type) => UserAuthMethod, (method) => method.user, {lazy: true})
  public authMethods!: Promise<UserAuthMethod[]>;

  @OneToMany((type) => UserSession, (sess) => sess.user, {lazy: true})
  public sessions!: Promise<UserSession[]>;
}
