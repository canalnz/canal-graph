import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm';
import User from './User';

export type AuthProvider = 'PASSWORD' | 'DISCORD' | 'GITHUB' | 'GOOGLE';
export const authProviders: AuthProvider[] = ['PASSWORD', 'DISCORD', 'GITHUB', 'GOOGLE'];

@Entity('user_auth_methods')
export default class UserAuthMethod {
  @ManyToOne((type) => User, (user) => user.authMethods, {lazy: true})
  @JoinColumn({name: 'user_id'})
  public user!: Promise<User>;

  @PrimaryColumn({
    name: 'user_id',
    type: 'bigint'
  })
  public userId!: string;

  @PrimaryColumn({
    type: 'enum',
    enum: authProviders
  })
  public provider!: AuthProvider;

  @Column({
    name: 'provider_id',
    type: 'bigint',
    nullable: true
  })
  public providerId!: string | null;

  @CreateDateColumn()
  public created!: Date;

  @Column()
  public expires!: Date;

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    nullable: true
  })
  public refreshToken!: string | null;

  @Column({
    name: 'access_token',
    type: 'varchar',
    nullable: true
  })
  public accessToken!: string | null;
}
