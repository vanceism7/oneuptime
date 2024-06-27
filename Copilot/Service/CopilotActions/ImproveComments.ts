import CopilotActionType from "Common/Types/Copilot/CopilotActionType";
import CopilotActionBase, {
  CopilotActionPrompt,
  CopilotActionRunResult,
  CopilotProcess,
} from "./CopilotActionsBase";
import CodeRepositoryUtil from "../../Utils/CodeRepository";
import ServiceLanguage from "Common/Types/ServiceCatalog/ServiceLanguage";

export default class ImproveComments extends CopilotActionBase {

  public isRequirementsMet: boolean = false
  
  public constructor() {
    super({
      copilotActionType: CopilotActionType.IMPROVE_COMMENTS,
      acceptFileExtentions: CodeRepositoryUtil.getCodeFileExtentions(),
    });
  }

  public override isActionComplete(_data: CopilotProcess): Promise<boolean> {
    return Promise.resolve(this.isRequirementsMet);
  }

  public override async onExecutionStep(data: CopilotProcess): Promise<CopilotProcess> {
    
    // ask copilot again if the requirements are met. 
    
  


    const oldCode: string = data.input.files[data.input.currentFilePath]?.fileContent as string;
    const newCode: string = data.result.files[data.input.currentFilePath]?.fileContent as string;

    const validationPrompt = await this.getValidationPrompt({oldCode, newCode});

    return data; 
  }

  public override async filterNoOperation(
    data: CopilotProcess,
  ): Promise<CopilotProcess> {
    const finalResult: CopilotActionRunResult = {
      files: {},
    };

    for (const filePath in data.result.files) {
      if (data.result.files[filePath]?.fileContent.includes("--all-good--")) {
        continue;
      }

      finalResult.files[filePath] = data.result.files[filePath]!;
    }

    return {
      ...data,
      result: finalResult,
    };
  }

  public async getValidationPrompt(data: {
    oldCode: string;
    newCode: string;
  }): Promise<CopilotActionPrompt> {

    const oldCode: string = data.oldCode;
    const newCode: string = data.newCode;

    const prompt = {
      prompt: `
        I've asked to improve comments in the code. 

        This is the old code: 

        ${oldCode}

        ---- 
        This is the new code: 

        ${newCode}

        Was anything changed in the code except comments? If yes, please reply with the following text: 
        --yes--

        If the code was not changed except comments, please reply with the following text:
        --no--
      `,
      systemPrompt: await this.getSystemPrompt()
    };

    return prompt; 
  }

  protected override async getPrompt(
    data: CopilotProcess,
  ): Promise<CopilotActionPrompt> {

    const fileLanguage: ServiceLanguage = data.input.files[data.input.currentFilePath]?.fileLanguage as ServiceLanguage;
    const code: string = data.input.files[data.input.currentFilePath]?.fileContent as string;

    const prompt: string = `Please improve the comments in this code. Please only comment code that is hard to understand. 

    If you think the code is already well commented, please reply with the following text:
    --all-good--
    
    Here is the code. This is in ${fileLanguage}: 
    
    ${code}
                `;

    const systemPrompt: string = await this.getSystemPrompt();

    return {
      prompt: prompt,
      systemPrompt: systemPrompt,
    };
  }

  public async getSystemPrompt(): Promise<string> {
    const systemPrompt: string = `You are an expert programmer. Here are your instructions:
- You will follow the instructions given by the user strictly.
- You will not deviate from the instructions given by the user.
- You will not change the code unnecessarily. For example you will not change the code structure, logic, quotes around strings, or functionality.`;

    return systemPrompt;
  }


  public async cleanup(data: CopilotProcess): Promise<CopilotProcess> {
    // this code contains text as well. The code is in betwen ```<type> and ```. Please extract the code and return it.
    // for example code can be in the format of
    // ```python
    // print("Hello World")
    // ```

    // so the code to be extracted is print("Hello World")

    // the code can be in multiple lines as well.

    const actionResult: CopilotActionRunResult = data.result;

    for (const filePath in actionResult.files) {
      // check all the files which were modified by the copilot action

      const file: CodeRepositoryFile | undefined = actionResult.files[filePath];

      if (!file) {
        continue;
      }

      const extractedCode: string = file.fileContent; // this is the code in the file

      if (!extractedCode.includes("```")) {
        actionResult.files[filePath]!.fileContent = extractedCode;
      }

      actionResult.files[filePath]!.fileContent =
        extractedCode.match(/```.*\n([\s\S]*?)```/)?.[1] ?? "";
    }

    return {
      input: data.input,
      result: actionResult,
    };
  }
}
