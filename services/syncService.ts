import { EventEmitter } from 'events';

/**
 * Service permettant la synchronisation entre les vues
 * Utilise un pattern EventEmitter pour communiquer entre les vues
 */
class ViewSyncService extends EventEmitter {
    private static instance: ViewSyncService;

    // Événements possibles
    public static readonly EVENTS = {
        STATE_CHANGED: 'state_changed',
        XP_UPDATED: 'xp_updated',
        LEVEL_UPDATED: 'level_updated',
        DATA_SAVED: 'data_saved',
        REFRESH_RATE_CHANGE: 'refresh_rate_change'
    };

    private constructor() {
        super();
        // Augmenter la limite d'écouteurs si nécessaire
        this.setMaxListeners(20);
    }

    public static getInstance(): ViewSyncService {
        if (!ViewSyncService.instance) {
            ViewSyncService.instance = new ViewSyncService();
        }
        return ViewSyncService.instance;
    }

    /**
     * Émet un événement de changement d'état avec les données 
     */
    emitStateChange(data: any): void {
        this.emit(ViewSyncService.EVENTS.STATE_CHANGED, data);
    }

    /**
     * Émet un événement spécifique de mise à jour d'XP
     */
    emitXPUpdate(xpAmount: number, newTotal: number): void {
        this.emit(ViewSyncService.EVENTS.XP_UPDATED, { amount: xpAmount, total: newTotal });
    }

    /**
     * Émet un événement de mise à jour de niveau
     */
    emitLevelUpdate(newLevel: number): void {
        this.emit(ViewSyncService.EVENTS.LEVEL_UPDATED, { level: newLevel });
    }

    /**
     * Émet un événement indiquant que les données ont été sauvegardées
     */
    emitDataSaved(): void {
        this.emit(ViewSyncService.EVENTS.DATA_SAVED, { timestamp: Date.now() });
    }

    /**
     * Émet un événement de changement de taux de rafraîchissement
     */
    emitRefreshRateChange(newRate: number): void {
        console.log('Emitting refresh rate change:', newRate);
        this.emit(ViewSyncService.EVENTS.REFRESH_RATE_CHANGE, newRate);
    }

    /**
     * S'abonne à tous les changements d'état
     */
    onStateChange(callback: (data: any) => void): () => void {
        this.on(ViewSyncService.EVENTS.STATE_CHANGED, callback);
        return () => {
            this.off(ViewSyncService.EVENTS.STATE_CHANGED, callback);
        };
    }

    /**
     * S'abonne aux mises à jour d'XP
     */
    onXPUpdate(callback: (data: { amount: number, total: number }) => void): () => void {
        this.on(ViewSyncService.EVENTS.XP_UPDATED, callback);
        return () => {
            this.off(ViewSyncService.EVENTS.XP_UPDATED, callback);
        };
    }

    /**
     * S'abonne aux mises à jour de niveau
     */
    onLevelUpdate(callback: (data: { level: number }) => void): () => void {
        this.on(ViewSyncService.EVENTS.LEVEL_UPDATED, callback);
        return () => {
            this.off(ViewSyncService.EVENTS.LEVEL_UPDATED, callback);
        };
    }

    /**
     * S'abonne aux événements de sauvegarde
     */
    onDataSaved(callback: (data: { timestamp: number }) => void): () => void {
        this.on(ViewSyncService.EVENTS.DATA_SAVED, callback);
        return () => {
            this.off(ViewSyncService.EVENTS.DATA_SAVED, callback);
        };
    }

    /**
     * S'abonne aux événements de changement de taux de rafraîchissement
     */
    onRefreshRateChange(callback: (newRate: number) => void): () => void {
        console.log('Subscribing to refresh rate changes');
        this.on(ViewSyncService.EVENTS.REFRESH_RATE_CHANGE, callback);
        return () => {
            this.off(ViewSyncService.EVENTS.REFRESH_RATE_CHANGE, callback);
        };
    }

    /**
     * Se désabonne de tous les événements pour une fonction donnée
     */
    unsubscribeAll(callback: Function): void {
        this.removeListener(ViewSyncService.EVENTS.STATE_CHANGED, callback as any);
        this.removeListener(ViewSyncService.EVENTS.XP_UPDATED, callback as any);
        this.removeListener(ViewSyncService.EVENTS.LEVEL_UPDATED, callback as any);
        this.removeListener(ViewSyncService.EVENTS.DATA_SAVED, callback as any);
        this.removeListener(ViewSyncService.EVENTS.REFRESH_RATE_CHANGE, callback as any);
    }
}

export const viewSyncService = ViewSyncService.getInstance();
