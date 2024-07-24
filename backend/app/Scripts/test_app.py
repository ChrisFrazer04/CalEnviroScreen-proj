from shiny import App, ui, render, reactive
import nest_asyncio

# Allow nested asyncio event loops
nest_asyncio.apply()


app_ui = ui.page_fluid(
    ui.layout_sidebar(
        ui.panel_sidebar(
            ui.h3("Sidebar"),
            ui.input_checkbox_group(
                "checkbox_group",
                "Choose options:",
                {
                    "option1": "Option 1",
                    "option2": "Option 2",
                    "option3": "Option 3"
                },
                selected=["option1", "option2"]
            ),
            ui.input_action_button("show_html", "Show HTML")
        ),
        ui.panel_main(
            ui.h3("Main Panel"),
            ui.output_text_verbatim("html_output")  # Using output_text_verbatim for better HTML display
        )
    )
)

# Define the server logic
def server(input, output, session):
    @reactive.Effect
    @reactive.event(input.show_html)
    def show_html():
        checkbox_group = ui.input_checkbox_group(
            "checkbox_group",
            "Choose options:",
            {
                "option1": "Option 1",
                "option2": "Option 2",
                "option3": "Option 3"
            },
            selected=["option1", "option2"]
        )
        imp_buttton = ui.input_action_button("impbuton", 'Input')
        img_button = ui.output_image('')
        html_str = render_html(imp_buttton)
        
        # Use the correct method to set the output
        @output
        @render.text
        def html_output():
            return html_str['html']

def render_html(element):
    html_str = element.render()
    return html_str


# Create the Shiny app
app = App(app_ui, server)

if __name__ == "__main__":
    app.run(port=8046)
