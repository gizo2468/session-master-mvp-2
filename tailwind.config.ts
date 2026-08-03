
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			boxShadow: {
				sm: '0 2px 6px 0 rgba(53, 101, 77, 0.18), 0 1px 3px -1px rgba(53, 101, 77, 0.12)',
				DEFAULT: '0 2px 8px 0 rgba(53, 101, 77, 0.16), 0 1px 4px -1px rgba(53, 101, 77, 0.1)',
			},
			fontFamily: {
				'space-grotesk': ['Space Grotesk', 'sans-serif'],
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				poker: {
					gold: '#D4AF37',
					darkGold: '#B8860B',
					green: '#1B5E20',
					feltGreen: '#35654D',
					red: '#B71C1C',
					black: '#212121',
					cream: '#FEF7CD',
					orange: '#F97316', // Adding orange color for the "Add Hand" button
					darkOrange: '#EA580C', // Adding dark orange for hover state
					purple: '#7C3AED',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'card-flip-front': {
					'0%': { transform: 'rotateY(0deg)' },
					'100%': { transform: 'rotateY(-180deg)' }
				},
				'card-flip-back': {
					'0%': { transform: 'rotateY(180deg)' },
					'100%': { transform: 'rotateY(0deg)' }
				},
				'card-unflip-front': {
					'0%': { transform: 'rotateY(-180deg)' },
					'100%': { transform: 'rotateY(0deg)' }
				},
				'card-unflip-back': {
					'0%': { transform: 'rotateY(0deg)' },
					'100%': { transform: 'rotateY(180deg)' }
				},
				'modal-slide-in': {
					'0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
					'100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
				},
				'modal-slide-out': {
					'0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
					'100%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' }
				},
				'pulse-red-breathe': {
					'0%, 100%': { backgroundColor: '#FEF2F2' },
					'50%': { backgroundColor: '#FEE2E2' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'card-flip-front': 'card-flip-front 0.6s ease-in-out forwards',
				'card-flip-back': 'card-flip-back 0.6s ease-in-out forwards',
				'card-unflip-front': 'card-unflip-front 0.6s ease-in-out forwards',
				'card-unflip-back': 'card-unflip-back 0.6s ease-in-out forwards',
				'modal-slide-in': 'modal-slide-in 0.3s ease-out forwards',
				'modal-slide-out': 'modal-slide-out 0.3s ease-in forwards',
				'pulse-red-breathe': 'pulse-red-breathe 2.5s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
