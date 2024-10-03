<template>
  <div class="app-container">
    <header>
      <h1 class="main-title">Poki Batalla</h1>
    </header>
    <main>
      <div v-if="!juegoIniciado" class="welcome-menu">
        <h2>¡Bienvenido a Poki Batalla!</h2>
        <div class="menu-section">
          <label for="rounds">Número de rondas:</label>
          <div class="rounds-selection">
            <button 
              v-for="n in 5" 
              :key="n" 
              @click="seleccionarRondas(n)" 
              :class="{ selected: rondas === n }"
              class="round-button"
            >
              {{ n }}
            </button>
          </div>
        </div>
        <div class="menu-section">
          <label for="stat">Elegir estadística de batalla:</label>
          <select v-model="estadisticaSeleccionada" class="stat-select">
            <option value="ataque">Ataque</option>
            <option value="defensa">Defensa</option>
            <option value="velocidad">Velocidad</option>
            <option value="hp">HP</option>
          </select>
        </div>
        <button @click="iniciarJuego" :disabled="!rondas" class="start-button">
          Comenzar Batalla
        </button>
      </div>

      <div v-else class="battle-arena">
        <h3>Ronda {{ rondaActual }} de {{ rondas }}</h3>

        <div class="pokemon-pool">
          <div class="pokemon-hand">
            <h4>Tu Pokémon</h4>
            <div class="pokemon-selection">
              <div v-for="(pokemon, index) in pokemonsJugador" 
                   :key="index" 
                   class="pokemon-card" 
                   @click="seleccionarPokemon(index)" 
                   :class="{ 
                     selected: indicesSeleccionados[0] === index,
                     used: pokemonesUtilizadosJugador.includes(index)
                   }">
                <h4>{{ pokemon.nombre }}</h4>
                <img :src="pokemon.sprites.front_default" :alt="pokemon.nombre" class="pokemon-image" />
                <div class="stats" v-if="pokemonesUtilizadosJugador.includes(index)">
                  <p>{{ estadisticaSeleccionada }}: {{ obtenerEstadistica(pokemon) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="pokemon-hand">
            <h4> Oponente</h4>
            <div class="pokemon-selection">
              <div v-for="(pokemon, index) in pokemonsOponente" 
                   :key="index" 
                   class="pokemon-card" 
                   :class="{ 
                     selected: indicesSeleccionados[1] === index, 
                     highlight: resaltarCartaOponente && indicesSeleccionados[1] === index,
                     used: pokemonesUtilizadosOponente.includes(index)
                   }">
                <h4>{{ pokemon.nombre }}</h4>
                <img :src="pokemon.sprites.front_default" :alt="pokemon.nombre" class="pokemon-image" />
                <div class="stats" v-if="pokemonesUtilizadosOponente.includes(index)">
                  <p>{{ estadisticaSeleccionada }}: {{ obtenerEstadistica(pokemon) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="battle-controls">
          <button @click="prepararBatalla" :disabled="cargando || indicesSeleccionados[0] === -1" class="battle-button">
            Seleccionar oponente
          </button>

          <button @click="iniciarBatalla" :disabled="cargando || !sePuedeBatallar" class="battle-button">
            ¡Batalla!
          </button>
        </div>

        <div v-if="resultadoRonda" class="resultado-ronda">
          <h3>Resultado de la ronda:</h3>
          <p :class="{'ganador': resultadoRonda === 'Jugador', 'perdedor': resultadoRonda === 'Oponente', 'empate': resultadoRonda === 'Empate'}">
            {{ resultadoRonda === 'Jugador' ? '¡Has ganado esta ronda!' :
               resultadoRonda === 'Oponente' ? 'El oponente ha ganado esta ronda.' :
               '¡Es un empate!' }}
          </p>
        </div>
      </div>
    </main>

    <teleport to="body">
      <div v-if="mostrarModal" class="modal">
        <div class="modal-content">
          <h3>Resumen del Juego</h3>
          <div class="game-summary">
            <h4>Resultados Finales</h4>
            <div class="score-container">
              <div v-for="(puntos, index) in puntos" :key="index" class="score-card">
                {{ index === 0 ? 'Jugador' : 'Oponente' }}: {{ puntos }}
              </div>
            </div>
            <h4 class="winner-announcement">
              {{ ganador === 'Empate' ? '¡Es un empate!' : '¡' + ganador + ' ha ganado!' }}
            </h4>
            
            <h4>Detalles de las Rondas</h4>
            <table class="rounds-table">
              <thead>
                <tr>
                  <th>Ronda</th>
                  <th>Tu Pokémon</th>
                  <th>Pokémon Oponente</th>
                  <th>{{ estadisticaSeleccionada }}</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(resultado, index) in resultadosDetallados" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ resultado.pokemonJugador.nombre }}</td>
                  <td>{{ resultado.pokemonOponente.nombre }}</td>
                  <td>
                    {{ obtenerEstadistica(resultado.pokemonJugador) }} vs 
                    {{ obtenerEstadistica(resultado.pokemonOponente) }}
                  </td>
                  <td>{{ resultado.ganador }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button @click="cerrarModal" class="modal-button">
            Nuevo Juego
          </button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import axios from 'axios';

const rondas = ref(0);
const rondaActual = ref(1);
const estadisticaSeleccionada = ref('ataque');
const juegoIniciado = ref(false);
const resultadosRonda = reactive([]);
const resultadosDetallados = reactive([]);
const pokemonsJugador = ref([]);
const pokemonsOponente = ref([]);
const puntos = reactive([0, 0]);
const ganador = ref('');
const cargando = ref(false);
const indicesSeleccionados = ref([-1, -1]);
const resaltarCartaOponente = ref(false);
const pokemonesUtilizadosJugador = ref([]);
const pokemonesUtilizadosOponente = ref([]);
const enBatalla = ref(false);
const juegoTerminado = ref(false);
const mostrarModal = ref(false);
const resultadoRonda = ref('');

const sePuedeBatallar = computed(() => 
  indicesSeleccionados.value[0] !== -1 && 
  indicesSeleccionados.value[1] !== -1 && 
  rondaActual.value <= rondas.value
);

const seleccionarRondas = (n) => {
  rondas.value = n;
};

const iniciarJuego = async () => {
  cargando.value = true;
  puntos[0] = 0;
  puntos[1] = 0;
  resultadosRonda.splice(0, resultadosRonda.length);
  resultadosDetallados.splice(0, resultadosDetallados.length);
  rondaActual.value = 1;
  indicesSeleccionados.value = [-1, -1];
  ganador.value = '';
  pokemonesUtilizadosJugador.value = [];
  pokemonesUtilizadosOponente.value = [];
  resultadoRonda.value = '';
  
  try {
    await generarPokemons();
    juegoIniciado.value = true;
  } catch (error) {
    console.error('Error al iniciar el juego:', error);
    
  } finally {
    cargando.value = false;
  }
};

const generarPokemons = async () => {
  const idsAleatorios = Array.from({ length: rondas.value * 2 }, () => Math.floor(Math.random() * 898) + 1);
  try {
    const respuestas = await Promise.all(idsAleatorios.map(id => axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`)));
    const datos = respuestas.map(res => res.data);
    pokemonsJugador.value = datos.slice(0, rondas.value).map(pokemon => ({
      ...pokemon,
      nombre: pokemon.name
    }));
    pokemonsOponente.value = datos.slice(rondas.value).map(pokemon => ({
      ...pokemon,
      nombre: pokemon.name
    }));
  } catch (error) {
    console.error('Error al obtener datos de Pokémon:', error);
    throw error;
  }
};

const obtenerEstadistica = (pokemon) => {
  if (!pokemon) return '?';
  const mapaEstadisticas = {
    ataque: 1,
    defensa: 2,
    velocidad: 5,
    hp: 0
  };
  return pokemon.stats[mapaEstadisticas[estadisticaSeleccionada.value]].base_stat;
};

const seleccionarPokemon = (index) => {
  if (pokemonesUtilizadosJugador.value.includes(index)) {
    
    return;
  }
  indicesSeleccionados.value[0] = index;
};

const seleccionarPokemonOponente = () => {
  const indicesDisponibles = pokemonsOponente.value
    .map((_, i) => i)
    .filter(i => !pokemonesUtilizadosOponente.value.includes(i));
  const indiceAleatorio = indicesDisponibles[Math.floor(Math.random() * indicesDisponibles.length)];
  indicesSeleccionados.value[1] = indiceAleatorio;
  resaltarCartaOponente.value = true;
  setTimeout(() => {
    resaltarCartaOponente.value = false;
  }, 1000);
};

const prepararBatalla = () => {
  if (indicesSeleccionados.value[0] !== -1) {
    seleccionarPokemonOponente();
  }
};

const iniciarBatalla = () => {
  if (!sePuedeBatallar.value || rondaActual.value > rondas.value) return;
  
  pokemonesUtilizadosJugador.value.push(indicesSeleccionados.value[0]);
  pokemonesUtilizadosOponente.value.push(indicesSeleccionados.value[1]);
  
  batalla();
};

const batalla = () => {
  if (enBatalla.value) return;
  enBatalla.value = true;

  const pokemonJugador = pokemonsJugador.value[indicesSeleccionados.value[0]];
  const pokemonOponente = pokemonsOponente.value[indicesSeleccionados.value[1]];
  const estadisticaJugador = obtenerEstadistica(pokemonJugador);
  const estadisticaOponente = obtenerEstadistica(pokemonOponente);
  let resultado = '';

  if (estadisticaJugador > estadisticaOponente) {
    puntos[0]++;
    resultado = 'Jugador';
  } else if (estadisticaJugador < estadisticaOponente) {
    puntos[1]++;
    resultado = 'Oponente';
  } else {
    resultado = 'Empate';
  }

  resultadosRonda.push(resultado);
  resultadosDetallados.push({
    pokemonJugador,
    pokemonOponente,
    ganador: resultado
  });

  resultadoRonda.value = resultado;

  enBatalla.value = false;

  if (rondaActual.value === rondas.value) {
    setTimeout(() => {
      determinarGanadorFinal();
    }, 2000);
  } else {
    setTimeout(() => {
      rondaActual.value++;
      indicesSeleccionados.value = [-1, -1];
      resultadoRonda.value = '';
    }, 500);
  }
};

const determinarGanadorFinal = () => {
  if (puntos[0] > puntos[1]) {
    ganador.value = 'Jugador';
  } else if (puntos[0] < puntos[1]) {
    ganador.value = 'Oponente';
  } else {
    ganador.value = 'Empate';
  }
  juegoTerminado.value = true;
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
  reiniciarJuego();
};

const reiniciarJuego = () => {
  juegoTerminado.value = false;
  juegoIniciado.value = false;
  rondas.value = 0;
  rondaActual.value = 1;
  resultadosRonda.splice(0, resultadosRonda.length);
  resultadosDetallados.splice(0, resultadosDetallados.length);
  pokemonsJugador.value = [];
  pokemonsOponente.value = [];
  puntos[0] = 0;
  puntos[1] = 0;
  ganador.value = '';
  indicesSeleccionados.value = [-1, -1];
  enBatalla.value = false;
  pokemonesUtilizadosJugador.value = [];
  pokemonesUtilizadosOponente.value = [];
  resultadoRonda.value = '';
};
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

:root {
  --pokemon-red: #FF0000;
  --pokemon-blue: #3B4CCA;
  --pokemon-yellow: #FFDE00;
  --pokemon-gold: #B3A125;
  --pokemon-green: #3DB743;
  --text-shadow-color: #2a2a2a;
  --text-color: #333333;
  --highlight-text-color: #1398e6;
}

body {
  background-color: #07f1e6;
  background-image: 
    url('https://i.pinimg.com/736x/19/d7/e5/19d7e5230158424ad58f112648115494.jpg'),
    linear-gradient(to bottom, #87CEEB, #E0F0FF);
  background-attachment: fixed;
  font-family: 'Press Start 2P', cursive;
  color: var(--text-color);
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #07f1e6;
  background-image: 
    url('https://i.pinimg.com/736x/19/d7/e5/19d7e5230158424ad58f112648115494.jpg'),
    linear-gradient(to bottom, #87CEEB, #E0F0FF);
  background-attachment: fixed;
  font-family: 'Press Start 2P', cursive;
  color: var(--text-color);
}

.main-title {
  text-align: center;
  color: var(--pokemon-blue);
  font-size: 3em;
  text-shadow: 3px 3px var(--pokemon-yellow), 5px 5px var(--text-shadow-color);
  animation: titlePulse 2s infinite, titleGlow 1.5s infinite alternate;
}

@keyframes titlePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes titleGlow {
  from { text-shadow: 3px 3px var(--pokemon-yellow), 5px 5px var(--text-shadow-color); }
  to { text-shadow: 3px 3px var(--pokemon-yellow), 5px 5px var(--text-shadow-color), 0 0 20px var(--pokemon-yellow); }
}

.welcome-menu {
  text-align: center;
  margin-top: 50px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1), 0 0 30px rgba(255, 222, 0, 0.2);
}

.menu-section {
  margin-bottom: 30px;
}

.rounds-selection {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
}

.round-button {
  padding: 15px 25px;
  background-color: var(--pokemon-blue);
  color: var(--highlight-text-color);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Press Start 2P', cursive;
  font-size: 1.2em;
  box-shadow: 0 5px 0 #2a3a99;
}

.round-button:hover {
  background-color: var(--pokemon-red);
  transform: scale(1.1);
  box-shadow: 0 7px 0 #990000, 0 0 20px rgba(255, 0, 0, 0.5);
}

.round-button.selected {
  background-color: var(--pokemon-yellow);
  color: var(--pokemon-blue);
  box-shadow: 0 0 10px var(--pokemon-gold), 0 0 20px var(--pokemon-yellow);
  animation: buttonGlow 1.5s infinite alternate;
}

@keyframes buttonGlow {
  from { box-shadow: 0 0 10px var(--pokemon-gold), 0 0 20px var(--pokemon-yellow); }
  to { box-shadow: 0 0 20px var(--pokemon-gold), 0 0 40px var(--pokemon-yellow); }
}

.stat-select {
  padding: 10px;
  font-size: 1em;
  font-family: 'Press Start 2P', cursive;
  background-color: var(--pokemon-yellow);
  border: 2px solid var(--pokemon-blue);
  border-radius: 5px;
  color: var(--pokemon-blue);
  cursor: pointer;
  transition: all 0.3s;
}

.stat-select:hover {
  background-color: var(--pokemon-blue);
  color: var(--pokemon-yellow);
  border-color: var(--pokemon-yellow);
}

.start-button, .battle-button, .modal-button {
  padding: 15px 30px;
  background-color: var(--pokemon-red);
  color: var(--highlight-text-color);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.2em;
  font-family: 'Press Start 2P', cursive;
  transition: all 0.3s;
  box-shadow: 0 5px 0 darkred, 0 0 20px rgba(255, 0, 0, 0.3);
}

.start-button:hover, .battle-button:hover {
  background-color: #ff3333;
  transform: translateY(-3px);
  box-shadow: 0 8px 0 darkred, 0 0 30px rgba(255, 0, 0, 0.5);
}

.battle-arena {
  margin-top: 30px;
  background-image: 

    url('https://i.pinimg.com/736x/19/d7/e5/19d7e5230158424ad58f112648115494.jpg');
  background-size: cover;
  background-position: center;
  padding: 30px;
  border-radius: 15px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2), 0 0 40px rgba(59, 76, 202, 0.3);
}

.pokemon-pool {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.pokemon-hand {
  width: 48%;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.pokemon-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.pokemon-card {
  width: calc(33% - 15px);
  border: 3px solid var(--pokemon-blue);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: rgba(11, 138, 241, 0.9);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.pokemon-card h4 {
  font-size: 0.8em;
  margin: 0 0 10px 0;
  word-wrap: break-word;
  hyphens: auto;
}

.pokemon-card:hover {
  transform: translateY(-10px) rotate(5deg);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 222, 0, 0.5);
}

.pokemon-card.selected {
  border-color: var(--pokemon-yellow);
  box-shadow: 0 0 20px var(--pokemon-yellow), 0 0 40px var(--pokemon-gold);
  animation: selectedPulse 1.5s infinite alternate;
}

@keyframes selectedPulse {
  from { box-shadow: 0 0 20px var(--pokemon-yellow), 0 0 40px var(--pokemon-gold); }
  to { box-shadow: 0 0 40px var(--pokemon-yellow), 0 0 80px var(--pokemon-gold); }
}


.pokemon-card {
  width: calc(33% - 15px);
  border: 3px solid var(--pokemon-blue);
  border-radius: 15px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background-color: rgba(5, 182, 252, 0.9);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
}

.pokemon-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.13) 77%,
    rgba(255, 255, 255, 0.5) 92%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(-45deg);
  z-index: 1;
  transition: all 0.6s;
  opacity: 0;
}

.pokemon-card:hover::before {
  animation: shine 1.5s infinite;
  opacity: 1;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(-45deg);
  }
  100% {
    transform: translateX(100%) rotate(-45deg);
  }
}

.pokemon-card h4 {
  font-size: 0.8em;
  margin: 0 0 10px 0;
  word-wrap: break-word;
  hyphens: auto;
  color: var(--pokemon-blue);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
}

.pokemon-card:hover {
  transform: translateY(-10px) rotate(5deg) scale(1.05);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 222, 0, 0.5);
}

.pokemon-card.selected {
  border-color: var(--pokemon-yellow);
  box-shadow: 0 0 20px var(--pokemon-yellow), 0 0 40px var(--pokemon-gold);
  animation: selectedPulse 1.5s infinite alternate;
}

@keyframes selectedPulse {
  from {
    box-shadow: 0 0 20px var(--pokemon-yellow), 0 0 40px var(--pokemon-gold);
    transform: scale(1);
  }
  to {
    box-shadow: 0 0 40px var(--pokemon-yellow), 0 0 80px var(--pokemon-gold);
    transform: scale(1.05);
  }
}

.pokemon-card.used {
  opacity: 0.5;
  filter: grayscale(100%);
  cursor: not-allowed;
  transform: scale(0.95);
  transition: all 0.3s ease;
}

.pokemon-card.used:hover {
  transform: scale(0.95);
  box-shadow: none;
}

.pokemon-image {
  width: 100%;
  height: auto;
  transition: transform 0.3s;
  position: relative;
  z-index: 2;
}

.pokemon-card:hover .pokemon-image {
  transform: scale(1.1) rotate(-5deg);
}

.pokemon-card .stats {
  background-color: rgba(59, 76, 202, 0.1);
  border-radius: 10px;
  padding: 5px;
  margin-top: 10px;
  font-size: 1.4em;
  color: var(--pokemon-blue);
  position: relative;
  z-index: 2;
  transition: all 0.3s;
}

.pokemon-card:hover .stats {
  background-color: rgba(59, 76, 202, 0.2);
  transform: scale(1.05);
}


@keyframes borderGlow {
  0% {
    box-shadow: 0 0 5px var(--pokemon-yellow), 0 0 10px var(--pokemon-yellow), 0 0 15px var(--pokemon-yellow);
  }
  100% {
    box-shadow: 0 0 20px var(--pokemon-yellow), 0 0 35px var(--pokemon-yellow), 0 0 50px var(--pokemon-yellow);
  }
}

.pokemon-card.selected {
  animation: borderGlow 1.5s infinite alternate;
}


@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pokemon-card {
  animation: fadeIn 0.5s ease-out;
}


.pokemon-card:hover {
  transform: translateY(-10px) rotate(5deg) scale(1.05);
}


.pokemon-card:active {
  transform: scale(0.95);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.1s;
}


.pokemon-card::after {
  content: attr(data-type);
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 2px 5px;
  border-radius: 10px;
  font-size: 0.7em;
  color: var(--pokemon-blue);
  z-index: 3;
}

@media (max-width: 768px) {
  .pokemon-card {
    width: calc(50% - 15px);
  }
}

@media (max-width: 480px) {
  .pokemon-card {
    width: 100%;
  }

  .pokemon-card h4 {
    font-size: 0.9em;
  }
}

.battle-controls {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 30px;
}

.battle-button:disabled {
  background-color: #1398e6;
  cursor: not-allowed;
  box-shadow: none;
}

.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: modalFadeIn 0.5s;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 15px;
  max-width: 80%;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(59, 76, 202, 0.4);
  animation: modalSlideIn 0.5s, modalGlow 2s infinite alternate;
}

@keyframes modalSlideIn {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes modalGlow {
  from { box-shadow: 0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(59, 76, 202, 0.4); }
  to { box-shadow: 0 0 50px rgba(255, 255, 255, 0.5), 0 0 100px rgba(59, 76, 202, 0.6); }
}

.game-summary {
  text-align: center;
}

.score-container {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
}

.score-card {
  padding: 15px 25px;
  background-color: var(--pokemon-blue);
  
  border-radius: 10px;
  font-size: 1.2em;
  box-shadow: 0 5px 0 darkblue;
}

.winner-announcement {
  font-size: 2em;
  color: var(--pokemon-yellow);
  margin-bottom: 30px;
  text-shadow: 2px 2px var(--pokemon-blue), 4px 4px var(--text-shadow-color);
  animation: winnerPulse 2s infinite, winnerGlow 1.5s infinite alternate;
}

@keyframes winnerPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes winnerGlow {
  from { text-shadow: 2px 2px var(--pokemon-blue), 4px 4px var(--text-shadow-color); }
  to { text-shadow: 2px 2px var(--pokemon-blue), 4px 4px var(--text-shadow-color), 0 0 20px var(--pokemon-yellow); }
}

.rounds-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
  margin-top: 30px;
}

.rounds-table th, .rounds-table td {
  border: none;
  padding: 15px;
  text-align: left;
  background-color: rgba(242, 242, 242, 0.8);
  transition: all 0.3s;
}

.rounds-table th {
  background-color: var(--pokemon-blue);
  
  font-weight: bold;
  text-transform: uppercase;
}

.rounds-table td {
  color: var(--highlight-text-color);
}

.rounds-table tr:nth-child(even) td {
  background-color: rgba(230, 230, 230, 0.8);
}

.rounds-table tr:hover td {
  background-color: rgba(255, 222, 0, 0.3);
  transform: scale(1.02);
}

.modal-button {
  background-color: var(--pokemon-green);
  box-shadow: 0 5px 0 darkgreen, 0 0 20px rgba(61, 183, 67, 0.3);
  margin-top: 30px;
}

.modal-button:hover {
  background-color: #4ecd74;
  transform: translateY(-3px);
  box-shadow: 0 8px 0 darkgreen, 0 0 30px rgba(61, 183, 67, 0.5);
}

.modal-button:active {
  transform: translateY(2px);
  box-shadow: 0 3px 0 darkgreen;
}

.alert {
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-family: 'Press Start 2P', cursive;
  animation: shake 0.5s;
}

.alert-error {
  background-color: #ffcccc;
  border: 2px solid #ff0000;
  color: #ff0000;
}

.alert-success {
  background-color: #ccffcc;
  border: 2px solid #00ff00;
  color: #008000;
}

.alert-warning {
  background-color: #ffffcc;
  border: 2px solid #ffff00;
  color: #808000;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}


.pokemon-icon {
  display: inline-block;
  width: 30px;
  height: 30px;
  background-size: contain;
  background-repeat: no-repeat;
  margin-right: 10px;
  vertical-align: middle;
}

.pokemon-icon-fire { background-image: url('https://assets.codepen.io/1538474/fire.svg'); }
.pokemon-icon-water { background-image: url('https://assets.codepen.io/1538474/water.svg'); }
.pokemon-icon-grass { background-image: url('https://assets.codepen.io/1538474/grass.svg'); }
.pokemon-icon-electric { background-image: url('https://assets.codepen.io/1538474/electric.svg'); }


.shine-effect {
  position: relative;
  overflow: hidden;
}

.shine-effect::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.13) 77%, rgba(255,255,255,0.5) 92%, rgba(255,255,255,0) 100%);
  transform: rotate(-30deg);
  animation: shine 6s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(-30deg); }
  20% { transform: translateX(100%) rotate(-30deg); }
  100% { transform: translateX(100%) rotate(-30deg); }
}

/* Estilos responsivos */
@media (max-width: 768px) {
  .pokemon-pool {
    flex-direction: column;
  }

  .pokemon-hand {
    width: 100%;
    margin-bottom: 20px;
  }

  .pokemon-card {
    width: calc(50% - 15px);
  }

  .battle-controls {
    flex-direction: column;
    align-items: center;
  }

  .battle-button {
    width: 100%;
    margin-bottom: 10px;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 2em;
  }

  .pokemon-card {
    width: 100%;
  }

  .rounds-selection {
    flex-wrap: wrap;
  }

  .round-button {
    font-size: 1em;
    padding: 10px 15px;
  }

  .modal-content {
    padding: 15px;
    max-width: 95%;
  }

  .rounds-table th, .rounds-table td {
    padding: 10px;
    font-size: 0.8em;
  }
}

@media (max-width: 350px) {
  .app-container {
    padding: 10px;
    font-size:0.4em;
  }

  .main-title {
    font-size: 1.5em;
  }

  .welcome-menu {
    padding: 15px;
  }

  .stat-select, .start-button, .battle-button, .modal-button {
    font-size: 0.9em;
    padding: 10px 20px;
  }

  .pokemon-card h4 {
    font-size: 0.7em;
  }

  .score-card {
    font-size: 1em;
    padding: 10px 15px;
  }

  .winner-announcement {
    font-size: 1.5em;
  }

  .rounds-table th, .rounds-table td {
    padding: 8px;
    font-size: 0.7em;
  }
}
</style>