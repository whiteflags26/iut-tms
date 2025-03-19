import seedDatabase from './component.seed';

const seedParams = {
  numberOfUsers: 20,
  numberOfRequisitions: 50,
  numberOfVehicles: 10,
  numberOfDrivers: 5,
  numberOfApprovals: 30,
};

seedDatabase(seedParams)
  .catch((error) => {
    console.error('Error seeding database:', error);
  });