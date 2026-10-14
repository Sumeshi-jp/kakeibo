import { collection, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export type CollectionName = 'accounts' | 'cards' | 'categories' | 'transactions' | 'recurring' | 'cardStatements'

/** データはすべて users/{uid}/ の下に置く（セキュリティルールで本人だけに制限するため） */
export const userCol = (uid: string, name: CollectionName) => collection(db, 'users', uid, name)
export const userDoc = (uid: string, name: CollectionName, id: string) => doc(db, 'users', uid, name, id)
export const settingsDoc = (uid: string) => doc(db, 'users', uid, 'settings', 'main')
