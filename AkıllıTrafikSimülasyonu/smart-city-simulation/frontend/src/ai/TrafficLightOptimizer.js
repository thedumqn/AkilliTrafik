import { GeneticAlgorithm } from './GeneticAlgorithm';

export class TrafficLightOptimizer {
  constructor(simulation) {
    this.simulation = simulation;
    this.ga = new GeneticAlgorithm({
      populationSize: 10,
      generations: 12,
      mutationRate: 0.15,
      crossoverRate: 0.7,
      elitismRate: 0.15,
      adaptiveMutation: true,
      multiObjective: true,
      nichingEnabled: false,
      islandModel: false
    });
    
    this.isOptimizing = false;
    this.testDuration = 150;
  }

  async evaluateTrafficLightSettings(genes) {
    return new Promise((resolve) => {
      this.applyGenesToTrafficLights(genes);
      this.simulation.clearVehiclesOnly();
      
      let frameCount = 0;
      let totalWaitTime = 0;
      let totalSpeed = 0;
      let totalDensity = 0;
      let measurements = 0;

      const testInterval = setInterval(() => {
        this.simulation.update();
        frameCount++;

        if (frameCount % 30 === 0 && this.simulation.vehicles.length > 0) {
          const stats = this.simulation.getStats();
          totalWaitTime += stats.avgWaitTime;
          totalSpeed += stats.avgSpeed;
          totalDensity += stats.density;
          measurements++;
        }

        if (frameCount >= this.testDuration) {
          clearInterval(testInterval);
          
          const avgWaitTime = totalWaitTime / Math.max(measurements, 1);
          const avgSpeed = totalSpeed / Math.max(measurements, 1);
          const avgDensity = totalDensity / Math.max(measurements, 1);
          
          const fitness = this.calculateFitness(avgWaitTime, avgSpeed, avgDensity);
          
          resolve({
            fitness: fitness,
            objectives: {
              waitTime: avgWaitTime,
              speed: avgSpeed,
              density: avgDensity
            }
          });
        }
      }, 0);
    });
  }

  calculateFitness(avgWaitTime, avgSpeed, avgDensity) {
    const waitScore = Math.max(0, 100 - (avgWaitTime * 1.5));
    const speedScore = Math.min(100, avgSpeed * 2);
    
    let densityScore = 0;
    if (avgDensity < 30) {
      densityScore = avgDensity * 2;
    } else if (avgDensity <= 60) {
      densityScore = 100;
    } else {
      densityScore = Math.max(0, 100 - (avgDensity - 60) * 2);
    }

    const fitness = (
      waitScore * 0.4 +
      speedScore * 0.4 +
      densityScore * 0.2
    );

    return fitness;
  }

  applyGenesToTrafficLights(genes) {
    const lights = this.simulation.trafficLights;
    for (let i = 0; i < lights.length && i < genes.length; i++) {
      const gene = genes[i];
      lights[i].setDuration('green', gene.greenDuration);
      lights[i].setDuration('yellow', gene.yellowDuration);
      lights[i].setDuration('red', gene.redDuration);
    }
  }

  async optimize(onProgress) {
    if (this.isOptimizing) {
      return null;
    }

    this.isOptimizing = true;
    const trafficLightCount = this.simulation.trafficLights.length;

    if (trafficLightCount === 0) {
      this.isOptimizing = false;
      return null;
    }

    try {
      const fitnessFunction = this.evaluateTrafficLightSettings.bind(this);
      const result = await this.ga.optimize(
        trafficLightCount,
        fitnessFunction,
        onProgress
      );

      this.applyGenesToTrafficLights(result.bestIndividual.genes);
      this.isOptimizing = false;
      return result;
    } catch (error) {
      console.error('Optimizasyon hatası:', error);
      this.isOptimizing = false;
      return null;
    }
  }
}