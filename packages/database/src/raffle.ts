/** Participante del sorteo: usuario con la cantidad de spots que coleccionó. */
export type RaffleParticipant = {
  user_id: string;
  user_email: string;
  user_name: string;
  user_avatar: string;
  spot_count: number;
};
