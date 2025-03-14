import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import helmet from 'helmet';
import passport from 'passport';
import { errorHandler } from './middlewares/error.middlware';
import { initializePassport } from './middlewares/auth.middleware';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

initializePassport();
app.use(passport.initialize());


// Routes
app.use('/api', routes);

// Error Handling
app.use(errorHandler);

export { app };