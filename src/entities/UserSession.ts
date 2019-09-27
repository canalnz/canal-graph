import {
  Column,
  CreateDateColumn,
  Entity, JoinColumn, ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import {AuthProvider, authProviders} from './UserAuthMethod';
import User from './User';

@Entity('user_sessions')
export default class UserSession {
  @ManyToOne((type) => User, (user) => user.sessions, {lazy: true})
  @JoinColumn({name: 'user_id'})
  public user!: Promise<User>;

  @PrimaryColumn({
    name: 'user_id',
    type: 'bigint'
  })
  public userId!: string;

  @PrimaryColumn()
  public token!: string;

  @CreateDateColumn()
  public created!: Date;

  @Column()
  public expires!: Date;

  @Column({
    name: 'auth_method',
    type: 'enum',
    enum: authProviders,
    nullable: true
  })
  public authMethod!: AuthProvider | null;

  @Column({
    name: 'creator_ip',
    type: 'inet',
    nullable: true
  })
  public creatorIp!: string | null;

  @Column({
    name: 'creator_ua',
    type: 'varchar',
    nullable: true
  })
  public creatorUa!: string | null;
}
