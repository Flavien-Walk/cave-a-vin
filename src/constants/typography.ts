import { Colors } from './colors';

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.brunMoka,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.brunMoka,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.brunMoka,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  h4: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.brunMoka,
    lineHeight: 20,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.brunMoka,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.brunMoyen,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: Colors.brunClair,
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.brunMoyen,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  price: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.ambreChaud,
  },
} as const;
