import { PlayerWrapper } from "../player-wrapper"
import { TailwindIndicator } from "../tailwind-indicator"
import { ThemeProvider } from "../theme-provider"
import { QueuePanel } from "../queue-panel"

export const Provider=({children}:{
    children:React.ReactNode
})=>{
    return(
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
            <PlayerWrapper />
                        <QueuePanel />
          <TailwindIndicator />
        </ThemeProvider>
    )
}