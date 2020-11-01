(()=>{"use strict";var e={607:(e,r,n)=>{Object.defineProperty(r,"__esModule",{value:!0});var o=n(307),a=0,s=0,t=0,l=0,i=0,p=6;function u(){p=0;var e=[];for(var r in Game.creeps){for(var n=Game.creeps[r].room.find(FIND_SOURCES),o=0;o<n.length;o++){for(var a=Game.creeps[r].room.find(FIND_SOURCES)[o],s=0,t=-1;t<=1;t++)for(var l=-1;l<=1;l++)0===t&&0===l||0===Game.map.getRoomTerrain(a.room.name).get(a.pos.x+t,a.pos.y+l)&&(s+=1);e.push({source:o,minerCount:s}),p+=s}return e}}function c(e,r,n,o){for(var a=0;a<o;a++){var s=Game.spawns.Spawn1.spawnCreep(r,""+e+a);if(0===s)return void console.log("Spawning "+e+" with parts "+r+" we have "+ ++n+" currently result "+s);-3!==s&&-4!==s&&console.log("Failed to spawn "+s)}}e.exports.loop=function(){var e=0,r=0,n=0,R=u();for(var f in Game.creeps)if(f.includes("miner")||f.includes("harvest"))for(var d=0,m=0,E=R;m<E.length;m++){var v=E[m];if((d+=v.minerCount)>e){e++,o.roleHarvester.run(f,v.source);break}}else if(f.includes("hauler")){var g=Game.creeps[f].room.find(FIND_DROPPED_RESOURCES);o.roleHauler.run(f,r++%g.length)}else f.includes("defender")&&(g=Game.creeps[f].room.find(FIND_EXIT),o.roleRangedDefender.run(f,n++%g.length));function G(){!function(){for(var e in u(),a=0,s=0,t=0,l=0,i=0,Game.creeps)e.includes("harvest")||e.includes("miner")?a++:e.includes("defenderRanged")?t++:e.includes("defenderMelee")?l++:e.includes("hauler")?s++:e.includes("worker")&&i++}();var e=Game.spawns.Spawn1;console.log("\n================START REPORT=================================="),console.log("Energy "+e.store.energy+"/"+e.store.getCapacity("energy")),console.log("Miner Count "+a+"/"+p),console.log("Hauler Count "+s+"/12"),console.log("WOrker Count "+i+"/2"),console.log("Ranged Defender Count "+t+"/15"),console.log("Melee Defender Count "+l+"/15"),console.log("=================END REPORT===================================\n")}Game.time%10==0&&G(),300===Game.spawns.Spawn1.store.energy&&(G(),a<p?c("miner",[WORK,WORK,MOVE],a,p):s<12?c("hauler",[CARRY,CARRY,MOVE],s,12):i<2?c("worker",[CARRY,MOVE,WORK],i,2):t<15?c("defenderRanged",[RANGED_ATTACK,TOUGH,MOVE],t,15):l<15&&c("defenderMelee",[TOUGH,ATTACK,MOVE],l,15))},e.exports.loop()},307:e=>{var r={roleHarvester:{run:function(e,r){var n=Game.creeps[e];if(n.store.getFreeCapacity()>0||null===n.store.getCapacity()){var o=n.room.find(FIND_SOURCES);n.harvest(o[r])==ERR_NOT_IN_RANGE&&n.moveTo(o[r])}else n.transfer(Game.spawns.Spawn1,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE&&n.moveTo(Game.spawns.Spawn1)}},roleHauler:{run:function(e,r){var n=Game.creeps[e],o=n.room.find(FIND_DROPPED_RESOURCES);0===n.store.getUsedCapacity()||function(e,r){return Math.abs(e.pos.x+r.x)+Math.abs(e.pos.y+r.y)}(n,o[r].pos)<3||0===n.store.getUsedCapacity()||n.store.getFreeCapacity()>0?n.pickup(o[r])==ERR_NOT_IN_RANGE&&n.moveTo(o[r]):n.transfer(Game.spawns.Spawn1,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE&&n.moveTo(Game.spawns.Spawn1)}},roleRangedDefender:{run:function(e,r){var n=Game.creeps[e],o=n.room.find(FIND_EXIT);o=Game.spawns.Spawn1.room.find(FIND_EXIT),n.moveTo(o[r])}}};e.exports=r}},r={};!function n(o){if(r[o])return r[o].exports;var a=r[o]={exports:{}};return e[o](a,a.exports,n),a.exports}(607)})();