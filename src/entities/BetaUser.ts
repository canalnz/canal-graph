import {CreateDateColumn, Entity, PrimaryColumn} from 'typeorm';

@Entity('beta_users')
export default class BetaUser {
  @PrimaryColumn({
    name: 'discord_id',
    type: 'bigint'
  })
  public discordId!: string;

  @CreateDateColumn()
  public added!: Date;
}
