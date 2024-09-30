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
                  <div class="carta-offside">
                    
                  </div>
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
        /* alert('Error al cargar los Pokémon. Por favor, inténtalo de nuevo.'); */
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
       /*  alert("Este Pokémon ya ha sido utilizado. Por favor, elige otro."); */
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


</style>
