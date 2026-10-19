import { randomInt, randomUUID } from 'node:crypto';

export type Card = { rank: string; suit: string; id: string };
export type Player = { id: string; name: string; ready: boolean; connected: boolean; lives: number; hand: Card[]; seat: number };
export type Play = { playerId: string; count: number; declared: string; actual: Card[]; createdAt: number };
export type Penalty = { id: string; targetId: string; liveChamber: number; trigger: number; startedAt: number; resolved: boolean };
export type Room = { code: string; players: Player[]; phase: 'lobby'|'playing'|'penalty'|'finished'; turn: number; target: string; pile: Play[]; discard: Card[]; penalty?: Penalty; lastMessage: string; version: number };
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const nameOf = (room: Room, id: string) => room.players.find(p => p.id === id)?.name ?? 'A player';
export function createRoom(code: string, playerId: string, name: string): Room {
  return { code, players: [{ id: playerId, name: cleanName(name), ready: false, connected: true, lives: 3, hand: [], seat: 0 }], phase: 'lobby', turn: 0, target: 'A', pile: [], discard: [], lastMessage: 'Room created. Invite your friends.', version: 1 };
}
export function cleanName(value: string) { return [...String(value || 'Player').trim().replace(/[<>]/g, '').slice(0, 16)].join('') || 'Player'; }
function refill(room: Room, playerId: string) {
  const player=room.players.find(p=>p.id===playerId); if(!player||player.hand.length||!room.discard.length)return;
  for(let i=room.discard.length-1;i>0;i--){const j=randomInt(i+1);[room.discard[i],room.discard[j]]=[room.discard[j],room.discard[i]];}
  player.hand.push(...room.discard.splice(0,Math.min(5,room.discard.length)));
}
function nextConnected(room: Room, from: number) {
  for(let step=1;step<=room.players.length;step++){const i=(from+step)%room.players.length;if(room.players[i].lives>0&&room.players[i].connected)return i;}
  return from;
}
export function addPlayer(room: Room, id: string, name: string) {
  if (room.phase !== 'lobby' || room.players.length >= 5) throw new Error('This room is full or already in a match.');
  if (room.players.some(p => p.id === id)) return;
  room.players.push({ id, name: cleanName(name), ready: false, connected: true, lives: 3, hand: [], seat: room.players.length }); room.lastMessage = `${nameOf(room,id)} joined the lounge.`; room.version++;
}
export function setReady(room: Room, id: string, ready: boolean) {
  const player = room.players.find(p => p.id === id); if (!player || room.phase !== 'lobby') throw new Error('You cannot ready up now.');
  player.ready = ready; room.version++;
  if (room.players.length >= 2 && room.players.every(p => p.ready && p.connected)) startGame(room);
}
export function startGame(room: Room) {
  const deck: Card[] = suits.flatMap(suit => ranks.map(rank => ({ rank, suit, id: randomUUID() })));
  for (let i=deck.length-1;i>0;i--) { const j=randomInt(i+1); [deck[i],deck[j]]=[deck[j],deck[i]]; }
  room.players.forEach((p,i) => { p.hand=[]; p.lives=3; p.ready=true; p.seat=i; });
  deck.forEach((card,i)=>room.players[i%room.players.length].hand.push(card));
  room.phase='playing'; room.turn=0; room.target=suits[randomInt(suits.length)]; room.pile=[]; room.discard=[]; room.penalty=undefined; room.lastMessage=`The game is on. Tell the truth… or don't.`; room.version++;
}
export function playCards(room: Room, id: string, cardIds: string[], declared: string) {
  if (room.phase !== 'playing' || room.turn !== room.players.findIndex(p=>p.id===id)) throw new Error('It is not your turn.');
  const player=room.players.find(p=>p.id===id)!; if(room.penalty?.resolved){room.pile=[];room.penalty=undefined;} if (!Array.isArray(cardIds)||cardIds.length<1||cardIds.length>3||new Set(cardIds).size!==cardIds.length) throw new Error('Play one to three different cards.');
  if (!suits.includes(declared)||declared!==room.target) throw new Error(`This table's call is ${room.target}. Play to that claim.`);
  const actual=cardIds.map(cid=>player.hand.find(c=>c.id===cid)); if(actual.some(c=>!c)) throw new Error('That card is not in your hand.');
  player.hand=player.hand.filter(c=>!cardIds.includes(c.id));
  room.pile.push({playerId:id,count:cardIds.length,declared,actual:actual.map(c=>c!),createdAt:Date.now()});
  room.lastMessage=`${player.name} played ${cardIds.length} card${cardIds.length>1?'s':''} and called ${declared}.`; room.turn=(room.turn+1)%room.players.length; room.version++;
}
export function challenge(room: Room, id: string, penaltyId: string=randomUUID()) {
  if(room.phase!=='playing'||room.turn!==room.players.findIndex(p=>p.id===id)) throw new Error('It is not your turn to challenge.');
  const play=room.pile.at(-1); if(!play||play.playerId===id) throw new Error('There is no claim you can challenge.');
  const lied=play.actual.some(c=>c.suit!==play.declared); const targetId=lied?play.playerId:id;
  room.penalty={id:penaltyId,targetId,liveChamber:randomInt(6),trigger:randomInt(6),startedAt:Date.now(),resolved:false};
  room.phase='penalty'; room.lastMessage=lied?`${nameOf(room,play.playerId)} was caught bluffing.`:`${nameOf(room,id)} challenged an honest play.`; room.version++;
  return {penaltyId,targetId,lied};
}
export function resolvePenalty(room: Room, penaltyId: string) {
  const p=room.penalty; if(room.phase!=='penalty'||!p||p.id!==penaltyId||p.resolved) throw new Error('This penalty has already resolved.');
  p.resolved=true; const hit=p.liveChamber===p.trigger; const target=room.players.find(x=>x.id===p.targetId);room.pile.forEach(play=>room.discard.push(...play.actual));
  if(target && hit) target.lives=Math.max(0,target.lives-1);
  const eliminated=!!target&&target.lives===0;
  room.lastMessage=hit?`${target?.name ?? 'The player'} lost a life.`:`${target?.name ?? 'The player'} got a harmless click and survived.`;
  room.phase='playing';
  const alive=room.players.filter(x=>x.lives>0);
  if(alive.length<=1){room.phase='finished';room.lastMessage=alive.length?`${alive[0].name} wins the lounge!`:'The lounge closes with no winner.';}
  else { const index=room.players.findIndex(x=>x.id===p.targetId); room.turn=nextConnected(room,index); room.target=suits[randomInt(suits.length)];refill(room,room.players[room.turn].id); }
  room.version++; return {penaltyId:p.id,targetId:p.targetId,hit,eliminated,lives:target?.lives??0,winner:room.phase==='finished'?alive[0]?.id:null};
}
export function advanceTurn(room: Room) {
  if(room.phase!=='playing') return;
  const n=nextConnected(room,room.turn); room.turn=n; refill(room,room.players[n].id); room.version++;
}
export function rematch(room: Room, playerId: string) {
  const caller=room.players.find(p=>p.id===playerId);if(room.phase!=='finished'||!caller)throw new Error('A rematch is available after the match ends.');
  room.phase='lobby';room.turn=0;room.pile=[];room.discard=[];room.penalty=undefined;room.target='A';
  room.players.forEach(p=>{p.ready=false;p.lives=3;p.hand=[];});room.lastMessage=`${caller.name} called for a rematch. Everyone ready up to deal again.`;room.version++;
}
export function publicRoom(room: Room, viewerId: string) {
  const viewer=room.players.find(p=>p.id===viewerId);
  return {code:room.code,phase:room.phase,turn:room.turn,target:room.target,pile:room.pile.map(({actual,...p})=>({...p,actual: room.penalty?.resolved?actual:[]})), players:room.players.map(({hand,...p})=>({...p,handCount:hand.length,hand:p.id===viewerId?hand:undefined})), lastMessage:room.lastMessage, version:room.version, penalty:room.penalty?{id:room.penalty.id,targetId:room.penalty.targetId,startedAt:room.penalty.startedAt,resolved:room.penalty.resolved}:undefined};
}
