export class GeneticAlgorithm {
  constructor(config = {}) {
    // Temel parametreler
    this.populationSize = config.populationSize || 20;
    this.generations = config.generations || 30;
    this.mutationRate = config.mutationRate || 0.15;
    this.crossoverRate = config.crossoverRate || 0.7;
    this.elitismRate = config.elitismRate || 0.15;
    
    // Gelişmiş özellikler
    this.adaptiveMutation = config.adaptiveMutation !== false; // Otomatik mutasyon ayarı
    this.multiObjective = config.multiObjective !== false; // Çok amaçlı optimizasyon
    this.nichingEnabled = config.nichingEnabled || false; // Çeşitlilik koruma
    this.islandModel = config.islandModel || false; // Paralel evrim
    
    // Island model parametreleri
    this.islandCount = config.islandCount || 3;
    this.migrationRate = config.migrationRate || 0.1;
    this.migrationInterval = config.migrationInterval || 5;
    
    // Niching parametreleri
    this.nicheRadius = config.nicheRadius || 0.3;
    
    // Durumlar
    this.population = [];
    this.islands = [];
    this.bestIndividual = null;
    this.bestFitness = -Infinity;
    this.fitnessHistory = [];
    this.currentGeneration = 0;
    this.stagnationCounter = 0;
    this.lastBestFitness = -Infinity;
  }

  /**
   * Rastgele birey oluştur
   */
  createRandomIndividual(geneCount) {
    const individual = {
      genes: [],
      fitness: 0,
      objectives: { waitTime: 0, speed: 0, density: 0 } // Multi-objective
    };

    for (let i = 0; i < geneCount; i++) {
      individual.genes.push({
        greenDuration: this.randomInt(30, 150),
        yellowDuration: this.randomInt(20, 40),
        redDuration: this.randomInt(30, 150)
      });
    }

    return individual;
  }

  /**
   * Popülasyon başlat
   */
  initializePopulation(geneCount) {
    if (this.islandModel) {
      // Island model: Her ada kendi popülasyonuna sahip
      this.islands = [];
      const islandSize = Math.floor(this.populationSize / this.islandCount);
      
      for (let i = 0; i < this.islandCount; i++) {
        const island = [];
        for (let j = 0; j < islandSize; j++) {
          island.push(this.createRandomIndividual(geneCount));
        }
        this.islands.push(island);
      }
    } else {
      // Normal popülasyon
      this.population = [];
      for (let i = 0; i < this.populationSize; i++) {
        this.population.push(this.createRandomIndividual(geneCount));
      }
    }
  }

  /**
   * Multi-objective fitness (NSGA-II benzeri)
   */
  async evaluateFitness(fitnessFunction, onProgress) {
    const populations = this.islandModel ? this.islands : [this.population];
    
    for (let islandIdx = 0; islandIdx < populations.length; islandIdx++) {
      const pop = populations[islandIdx];
      
      for (let i = 0; i < pop.length; i++) {
        const individual = pop[i];
        
        // Fitness hesapla
        const result = await fitnessFunction(individual.genes);
        
        if (this.multiObjective) {
          // Çok amaçlı: Ayrı hedefler
          individual.objectives = result.objectives || {
            waitTime: result.waitTime || 0,
            speed: result.speed || 0,
            density: result.density || 0
          };
          
          // Pareto dominance ile fitness
          individual.fitness = this.calculateParetoFitness(individual.objectives);
        } else {
          // Tek amaçlı
          individual.fitness = result.fitness || result;
        }
        
        // En iyi bireyi kaydet
        if (individual.fitness > this.bestFitness) {
          this.bestFitness = individual.fitness;
          this.bestIndividual = JSON.parse(JSON.stringify(individual));
        }

        // Progress callback
        if (onProgress) {
          const totalPop = this.islandModel 
            ? this.islands.reduce((sum, isl) => sum + isl.length, 0)
            : this.populationSize;
          
          const current = islandIdx * pop.length + i + 1;
          
          onProgress({
            generation: this.currentGeneration,
            individual: current,
            total: totalPop,
            bestFitness: this.bestFitness
          });
        }
      }
    }
    
    // Stagnation kontrolü (adaptive mutation için)
    if (Math.abs(this.bestFitness - this.lastBestFitness) < 0.1) {
      this.stagnationCounter++;
    } else {
      this.stagnationCounter = 0;
    }
    this.lastBestFitness = this.bestFitness;
  }

  /**
   * Pareto fitness hesapla (multi-objective)
   */
  calculateParetoFitness(objectives) {
    // Normalleştir ve ağırlıklı topla
    const weights = { waitTime: 0.4, speed: 0.4, density: 0.2 };
    
    // Bekleme süresini minimize et (düşük iyi)
    const waitScore = Math.max(0, 100 - objectives.waitTime * 1.5);
    
    // Hızı maksimize et (yüksek iyi)
    const speedScore = Math.min(100, objectives.speed * 2);
    
    // Yoğunluğu optimize et (orta iyi)
    let densityScore;
    if (objectives.density < 30) {
      densityScore = objectives.density * 2;
    } else if (objectives.density <= 60) {
      densityScore = 100;
    } else {
      densityScore = Math.max(0, 100 - (objectives.density - 60) * 2);
    }
    
    return (
      waitScore * weights.waitTime +
      speedScore * weights.speed +
      densityScore * weights.density
    );
  }

  /**
   * Adaptive mutation rate (durgunluk varsa artır)
   */
  getAdaptiveMutationRate() {
    if (!this.adaptiveMutation) return this.mutationRate;
    
    // Durgunluk varsa mutasyonu artır
    if (this.stagnationCounter > 5) {
      return Math.min(0.4, this.mutationRate * (1 + this.stagnationCounter * 0.1));
    }
    
    // İlerleme varsa mutasyonu azalt
    return Math.max(0.05, this.mutationRate * 0.9);
  }

  /**
   * Turnuva seçimi (niching destekli)
   */
  tournamentSelection(population, tournamentSize = 3) {
    let best = null;
    
    for (let i = 0; i < tournamentSize; i++) {
      const candidate = population[this.randomInt(0, population.length - 1)];
      
      if (!best || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    
    // Niching: Çok benzer bireyleri cezalandır
    if (this.nichingEnabled && best) {
      const nicheCount = this.countNicheMembers(best, population);
      if (nicheCount > population.length * 0.3) {
        // Çok fazla benzer birey var, fitness azalt
        best = JSON.parse(JSON.stringify(best));
        best.fitness *= 0.8;
      }
    }
    
    return JSON.parse(JSON.stringify(best));
  }

  /**
   * Niching: Benzer birey sayısı
   */
  countNicheMembers(individual, population) {
    let count = 0;
    
    for (const other of population) {
      const distance = this.geneticDistance(individual, other);
      if (distance < this.nicheRadius) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Genetik mesafe (benzerlik)
   */
  geneticDistance(ind1, ind2) {
    let totalDiff = 0;
    
    for (let i = 0; i < ind1.genes.length; i++) {
      const g1 = ind1.genes[i];
      const g2 = ind2.genes[i];
      
      const diff = Math.abs(g1.greenDuration - g2.greenDuration) +
                   Math.abs(g1.yellowDuration - g2.yellowDuration) +
                   Math.abs(g1.redDuration - g2.redDuration);
      
      totalDiff += diff;
    }
    
    // Normalize (0-1 arası)
    const maxDiff = ind1.genes.length * (150 + 40 + 150) * 2;
    return totalDiff / maxDiff;
  }

  /**
   * Çaprazlama (2-point crossover)
   */
  crossover(parent1, parent2) {
    const child1 = { genes: [], fitness: 0, objectives: {} };
    const child2 = { genes: [], fitness: 0, objectives: {} };

    if (Math.random() < this.crossoverRate) {
      // 2-point crossover (daha iyi karışım)
      const point1 = this.randomInt(1, parent1.genes.length - 2);
      const point2 = this.randomInt(point1 + 1, parent1.genes.length - 1);
      
      child1.genes = [
        ...parent1.genes.slice(0, point1),
        ...parent2.genes.slice(point1, point2),
        ...parent1.genes.slice(point2)
      ];
      
      child2.genes = [
        ...parent2.genes.slice(0, point1),
        ...parent1.genes.slice(point1, point2),
        ...parent2.genes.slice(point2)
      ];
    } else {
      child1.genes = [...parent1.genes];
      child2.genes = [...parent2.genes];
    }

    return [child1, child2];
  }

  /**
   * Mutasyon (adaptive + gaussian)
   */
  mutate(individual) {
    const currentMutationRate = this.getAdaptiveMutationRate();
    
    for (let i = 0; i < individual.genes.length; i++) {
      if (Math.random() < currentMutationRate) {
        const gene = individual.genes[i];
        const properties = ['greenDuration', 'yellowDuration', 'redDuration'];
        const property = properties[this.randomInt(0, 2)];
        
        // Gaussian mutation (daha yumuşak değişimler)
        const gaussianChange = this.gaussianRandom(0, 20);
        gene[property] = Math.max(20, Math.min(200, gene[property] + gaussianChange));
      }
    }
  }

  /**
   * Gaussian rastgele sayı
   */
  gaussianRandom(mean = 0, stdDev = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Yeni nesil oluştur
   */
  createNextGeneration() {
    if (this.islandModel) {
      // Her ada için ayrı evrim
      this.islands.forEach(island => {
        this.evolvePopulation(island);
      });
      
      // Migration (adalar arası göç)
      if (this.currentGeneration % this.migrationInterval === 0) {
        this.performMigration();
      }
    } else {
      this.evolvePopulation(this.population);
    }
  }

  /**
   * Popülasyon evrimi
   */
  evolvePopulation(population) {
    const newPopulation = [];
    
    // Elitizm
    const eliteCount = Math.floor(population.length * this.elitismRate);
    const sortedPop = [...population].sort((a, b) => b.fitness - a.fitness);
    
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push(JSON.parse(JSON.stringify(sortedPop[i])));
    }

    // Çaprazlama ve mutasyon
    while (newPopulation.length < population.length) {
      const parent1 = this.tournamentSelection(population);
      const parent2 = this.tournamentSelection(population);
      
      const [child1, child2] = this.crossover(parent1, parent2);
      
      this.mutate(child1);
      this.mutate(child2);
      
      newPopulation.push(child1);
      if (newPopulation.length < population.length) {
        newPopulation.push(child2);
      }
    }

    // Popülasyonu güncelle
    for (let i = 0; i < population.length; i++) {
      population[i] = newPopulation[i];
    }
  }

  /**
   * Adalar arası göç (island model)
   */
  performMigration() {
    const migrantCount = Math.floor(this.islands[0].length * this.migrationRate);
    
    for (let i = 0; i < this.islandCount; i++) {
      const nextIsland = (i + 1) % this.islandCount;
      
      // En iyi bireyleri gönder
      const sortedIsland = [...this.islands[i]].sort((a, b) => b.fitness - a.fitness);
      const migrants = sortedIsland.slice(0, migrantCount);
      
      // Diğer adanın en kötülerini değiştir
      const targetSorted = [...this.islands[nextIsland]].sort((a, b) => a.fitness - b.fitness);
      for (let j = 0; j < migrantCount; j++) {
        const targetIdx = this.islands[nextIsland].indexOf(targetSorted[j]);
        this.islands[nextIsland][targetIdx] = JSON.parse(JSON.stringify(migrants[j]));
      }
    }
  }

  /**
   * Ana optimizasyon döngüsü
   */
  async optimize(geneCount, fitnessFunction, onProgress) {
    this.initializePopulation(geneCount);
    this.fitnessHistory = [];

    for (let gen = 0; gen < this.generations; gen++) {
      this.currentGeneration = gen;
      
      // Fitness hesapla
      await this.evaluateFitness(fitnessFunction, onProgress);
      
      // İstatistikler
      const allPop = this.islandModel 
        ? this.islands.flat() 
        : this.population;
      
      const avgFitness = allPop.reduce((sum, ind) => sum + ind.fitness, 0) / allPop.length;
      
      this.fitnessHistory.push({
        generation: gen,
        best: this.bestFitness,
        average: avgFitness
      });

      // Progress callback
      if (onProgress) {
        onProgress({
          generation: gen + 1,
          total: this.generations,
          bestFitness: this.bestFitness,
          averageFitness: avgFitness,
          improvement: gen > 0 ? ((this.bestFitness - this.fitnessHistory[0].best) / this.fitnessHistory[0].best * 100) : 0,
          mutationRate: this.getAdaptiveMutationRate(),
          stagnation: this.stagnationCounter
        });
      }

      // Yeni nesil
      if (gen < this.generations - 1) {
        this.createNextGeneration();
      }
    }

    return {
      bestIndividual: this.bestIndividual,
      bestFitness: this.bestFitness,
      history: this.fitnessHistory
    };
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  exportResults() {
    return {
      bestGenes: this.bestIndividual?.genes || [],
      bestFitness: this.bestFitness,
      bestObjectives: this.bestIndividual?.objectives || {},
      generations: this.currentGeneration + 1,
      history: this.fitnessHistory,
      config: {
        populationSize: this.populationSize,
        generations: this.generations,
        mutationRate: this.mutationRate,
        crossoverRate: this.crossoverRate,
        adaptiveMutation: this.adaptiveMutation,
        multiObjective: this.multiObjective,
        islandModel: this.islandModel
      }
    };
  }
}