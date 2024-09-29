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
                   :class="{ selected: indicesSeleccionados[0] === index }">
                <h4>{{ pokemon.nombre }}</h4>
                <img :src="pokemon.sprites.front_default" :alt="pokemon.nombre" class="pokemon-image" />
                <div class="stats" v-if="mostrarEstadisticas || pokemonesUtilizadosJugador.includes(index)">
                  <p>{{ estadisticaSeleccionada }}: {{ obtenerEstadistica(pokemon) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="pokemon-hand">
            <h4>Pokémon del Oponente</h4>
            <div class="pokemon-selection">
              <div v-for="(pokemon, index) in pokemonsOponente" 
                   :key="index" 
                   class="pokemon-card" 
                   :class="{ selected: indicesSeleccionados[1] === index, highlight: resaltarCartaOponente && indicesSeleccionados[1] === index }">
                <h4>{{ pokemon.nombre }}</h4>
                <img :src="pokemon.sprites.front_default" :alt="pokemon.nombre" class="pokemon-image" />
                <div class="stats" v-if="mostrarEstadisticas || pokemonesUtilizadosOponente.includes(index)">
                  <p>{{ estadisticaSeleccionada }}: {{ obtenerEstadistica(pokemon) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button @click="prepararBatalla" :disabled="cargando || indicesSeleccionados[0] === -1" class="battle-button">
          Seleccionar oponente
        </button>

        <button @click="iniciarBatalla" :disabled="cargando || !sePuedeBatallar" class="battle-button">
          ¡Batalla!
        </button>

        <div v-if="mostrarEstadisticas" class="battle-info">
          <h4>Estadísticas de Batalla</h4>
          <div class="stat-info">
            <h5>Tu Pokémon: {{ pokemonsJugador[indicesSeleccionados[0]].nombre }}</h5>
            <p>Estadística: {{ obtenerEstadistica(pokemonsJugador[indicesSeleccionados[0]]) }}</p>
          </div>
          <div class="stat-info">
            <h5>Pokémon del Oponente: {{ pokemonsOponente[indicesSeleccionados[1]].nombre }}</h5>
            <p>Estadística: {{ obtenerEstadistica(pokemonsOponente[indicesSeleccionados[1]]) }}</p>
          </div>
        </div>

        <div v-if="resultadosRonda.length > 0" class="results">
          <h3>Resultados de las Rondas</h3>
          <div v-for="(resultado, index) in resultadosRonda" :key="index" class="round-result">
            Ronda {{ index + 1 }}: {{ resultado }}
          </div>
        </div>

        <div v-if="juegoTerminado" class="results">
          <h3>Resultados Finales</h3>
          <div class="score-container">
            <div v-for="(puntos, index) in puntos" :key="index" class="score-card">
              {{ index === 0 ? 'Jugador' : 'Oponente' }}: {{ puntos }}
            </div>
          </div>
          <h4 class="winner-announcement" v-if="ganador">
            {{ ganador === 'Empate' ? '¡Es un empate!' : '¡' + ganador + ' ha ganado!' }}
          </h4>
          <button @click="reiniciarJuego" class="reset-button">Nuevo Juego</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue';

export default {
  setup() {
    const rondas = ref(0);
    const rondaActual = ref(1);
    const estadisticaSeleccionada = ref('ataque');
    const juegoIniciado = ref(false);
    const resultadosRonda = reactive([]);
    const pokemonsJugador = ref([]);
    const pokemonsOponente = ref([]);
    const puntos = reactive([0, 0]);
    const ganador = ref('');
    const cargando = ref(false);
    const indicesSeleccionados = ref([-1, -1]);
    const mostrarEstadisticas = ref(false);
    const resaltarCartaOponente = ref(false);
    const pokemonesUtilizadosJugador = ref([]);
    const pokemonesUtilizadosOponente = ref([]);
    const enBatalla = ref(false);
    const juegoTerminado = ref(false);

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
      rondaActual.value = 1;
      indicesSeleccionados.value = [-1, -1];
      mostrarEstadisticas.value = false;
      ganador.value = '';
      pokemonesUtilizadosJugador.value = [];
      pokemonesUtilizadosOponente.value = [];
      
      try {
        await generarPokemons();
        juegoIniciado.value = true;
      } catch (error) {
        console.error('Error al iniciar el juego:', error);
        alert('Error al cargar los Pokémon. Por favor, inténtalo de nuevo.');
      } finally {
        cargando.value = false;
      }
    };

    const generarPokemons = async () => {
      const idsAleatorios = Array.from({ length: rondas.value * 2 }, () => Math.floor(Math.random() * 898) + 1);
      try {
        const respuestas = await Promise.all(idsAleatorios.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)));
        const datos = await Promise.all(respuestas.map(res => res.json()));
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
      if (!pokemon) return 0;
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
        alert("Este Pokémon ya ha sido utilizado. Por favor, elige otro.");
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
      
      mostrarEstadisticas.value = true;
      batalla();
    };

    const batalla = () => {
      if (enBatalla.value) return;
      enBatalla.value = true;

      const estadisticaJugador = obtenerEstadistica(pokemonsJugador.value[indicesSeleccionados.value[0]]);
      const estadisticaOponente = obtenerEstadistica(pokemonsOponente.value[indicesSeleccionados.value[1]]);
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
      enBatalla.value = false;

      if (rondaActual.value === rondas.value) {
        determinarGanadorFinal();
      } else {
        rondaActual.value++;
        indicesSeleccionados.value = [-1, -1];
        mostrarEstadisticas.value = false;
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
      mostrarEstadisticas.value = true;
      juegoTerminado.value = true;
    };

    const reiniciarJuego = () => {
      juegoTerminado.value = false;
      juegoIniciado.value = false;
      reiniciarEstado();
    };

    const reiniciarEstado = () => {
      rondas.value = 0;
      rondaActual.value = 1;
      resultadosRonda.splice(0, resultadosRonda.length);
      pokemonsJugador.value = [];
      pokemonsOponente.value = [];
      puntos[0] = 0;
      puntos[1] = 0;
      ganador.value = '';
      indicesSeleccionados.value = [-1, -1];
      mostrarEstadisticas.value = false;
      enBatalla.value = false;
      juegoTerminado.value = false;
      pokemonesUtilizadosJugador.value = [];
      pokemonesUtilizadosOponente.value = [];
    };

    return {
      rondas,
      rondaActual,
      estadisticaSeleccionada,
      juegoIniciado,
      resultadosRonda,
      pokemonsJugador,
      pokemonsOponente,
      puntos,
      ganador,
      cargando,
      indicesSeleccionados,
      mostrarEstadisticas,
      resaltarCartaOponente,
      sePuedeBatallar,
      pokemonesUtilizadosJugador,
      pokemonesUtilizadosOponente,
      juegoTerminado,
      seleccionarRondas,
      iniciarJuego,
      seleccionarPokemon,
      seleccionarPokemonOponente,
      prepararBatalla,
      iniciarBatalla,
      obtenerEstadistica,
      reiniciarJuego
    };
  }
};
</script>
<style scoped>
body {
  font-family: 'Roboto', sans-serif;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: #333;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

header {
  text-align: center;
  padding: 20px 0;
}

.main-title {
  font-size: 4em;
  color: #ff4500;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 69, 0, 0.5);
  margin: 0;
  animation: titlePulse 2s infinite alternate, rainbowText 5s linear infinite;
}

@keyframes titlePulse {
  from { transform: scale(1); }
  to { transform: scale(1.05) rotate(2deg); }
}

@keyframes rainbowText {
  0% { color: #ff4500; }
  25% { color: #ffd700; }
  50% { color: #00ff00; }
  75% { color: #00bfff; }
  100% { color: #ff4500; }
}





.welcome-menu {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 30px auto;
  border: 2px solid #007bff;
  transition: all 0.3s ease;
  animation: fadeInUp 1s ease-out;
}

.welcome-menu:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.menu-section {
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.menu-section:hover {
  background-color: #e9ecef;
  transform: scale(1.02);
}

.menu-section label {
  font-size: 1.2em;
  color: #007bff;
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}

.rounds-selection {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.round-button {
  padding: 10px 20px;
  border: 2px solid #007bff;
  background-color: #fff;
  color: #007bff;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 25px;
  flex: 1 0 auto;
  max-width: 80px;
}

.round-button:hover {
  background-color: #007bff;
  color: #fff;
  transform: translateY(-2px);
}

.round-button.selected {
  background-color: #007bff;
  color: #fff;
  box-shadow: 0 2px 5px rgba(0, 123, 255, 0.5);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.stat-select {
  width: 100%;
  padding: 10px;
  font-size: 1em;
  border: 2px solid #007bff;
  border-radius: 25px;
  appearance: none;
  background: url('data:image/svg+xml;utf8,<svg fill="%23007bff" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>') no-repeat right 10px center #fff;
  background-size: 20px;
  transition: all 0.3s ease;
}

.stat-select:hover, .stat-select:focus {
  border-color: #0056b3;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.start-button {
  display: block;
  width: 100%;
  padding: 15px;
  background-color: #28a745;
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 1.2em;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 1px;
}

.start-button:hover {
  background-color: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  animation: glowing 1.5s infinite;
}

@keyframes glowing {
  0% { box-shadow: 0 0 5px #28a745; }
  50% { box-shadow: 0 0 20px #28a745; }
  100% { box-shadow: 0 0 5px #28a745; }
}

.start-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  animation: none;
}

.battle-arena {
  margin-top: 30px;
  animation: fadeIn 1s ease-out;
  background: linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.pokemon-pool {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  perspective: 1000px;
}

.pokemon-hand {
  width: 48%;
  animation: rotateIn 0.8s ease-out;
  transform-style: preserve-3d;
}

@keyframes rotateIn {
  from { transform: rotateY(90deg); opacity: 0; }
  to { transform: rotateY(0); opacity: 1; }
}

.pokemon-card {
  width: 150px;
  height: 210px;
  margin: 10px;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  border-radius: 15px;
  box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
  position: relative;
  overflow: hidden;
}

.pokemon-card:hover {
  transform: translateY(-10px) rotate(0deg) scale(1.05);
  z-index: 10;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.pokemon-card.selected {
  transform: translateY(-20px) rotate(0deg) scale(1.1);
  box-shadow: 0 20px 40px rgba(0, 123, 255, 0.3);
  z-index: 20;
  animation: selectedPulse 2s infinite;
}

@keyframes selectedPulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(0, 123, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
}

.pokemon-card h4 {
  font-size: 1em;
  margin: 10px 0;
  text-align: center;
  color: #333;
}

.pokemon-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin: 0 auto;
  display: block;
  transition: all 0.3s ease;
}

.pokemon-card:hover .pokemon-image,
.pokemon-card.selected .pokemon-image {
  transform: scale(1.1) rotate(5deg);
}

.pokemon-card .stats {
  padding: 10px;
  background-color: rgba(0, 123, 255, 0.1);
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.pokemon-card:hover .stats,
.pokemon-card.selected .stats {
  transform: translateY(0);
}

.battle-button {
  display: block;
  width: 200px;
  margin: 30px auto;
  padding: 15px;
  background: linear-gradient(45deg, #ff4500, #ff8c00);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1.2em;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  font-weight: bold;
}

.battle-button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: rotate(45deg);
  transition: all 0.5s ease;
}

.battle-button:hover::before {
  left: 100%;
}

.battle-button:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(255, 69, 0, 0.4);
}



.battle-info {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 20px;
  margin-top: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.5s ease-out;
}

.battle-info h4 {
  font-size: 1.5em;
  color: #007bff;
  margin-bottom: 15px;
  text-align: center;
}

.stat-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.stat-info:hover {
  background-color: #e9ecef;
  transform: translateX(5px);
}

.results {
  background: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%);
  border-radius: 15px;
  padding: 30px;
  margin-top: 30px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 1s ease-out;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
}

.results h3 {
  font-size: 2.5em;
  color: #ff4500;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  text-align: center;
}

.score-container {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.score-card {
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  padding: 20px 40px;
  border-radius: 15px;
  font-size: 1.4em;
  box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 200px;
  max-width: 300px;
  margin: 10px;
  position: relative;
  overflow: hidden;
}

.score-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  transform: rotate(45deg);
  transition: all 0.5s ease;
}

.score-card:hover::before {
  left: 100%;
}

.score-card:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.winner-announcement {
  font-size: 2.2em;
  color: #ff4500;
  margin: 30px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  animation: winnerGlow 2s infinite alternate;
  width: 100%;
  text-align: center;
}

@keyframes winnerGlow {
  from { text-shadow: 0 0 5px #ff4500, 0 0 10px #ff4500, 0 0 15px #ff4500; }
  to { text-shadow: 0 0 10px #ff4500, 0 0 20px #ff4500, 0 0 30px #ff4500; }
}

.reset-button {
  background: linear-gradient(45deg, #00f260, #0575e6);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2em;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-weight: bold;
  margin-top: 20px;
  width: 100%;
  max-width: 300px;
}

.reset-button:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0, 245, 96, 0.4);
}
.winner-announcement {
  font-size: 2.2em;
  color: #ffc107;
  margin: 30px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  animation: winnerGlow 2s infinite alternate;
}


</style>
