import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export * from './image'
export * from './icons'
export * from './device'
export * from './entities'

export function getEnderecoFromCEP(cep:string) {
	return fetch(`https://viacep.com.br/ws/${cep}/json/`)
		.then((res) => res.json())
		.then((data) => {
			if (data.erro) {
				return null;
			}
			return data;
		});
}